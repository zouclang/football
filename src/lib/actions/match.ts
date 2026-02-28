"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type MatchInput = {
    id?: string
    date: string
    opponent: string
    type: string // "LEAGUE", "INTERNAL_WARMUP", "EXTERNAL_FRIENDLY"
    leagueName?: string | null // 当 type 为 LEAGUE 或高校联赛 时保存赛事名
    tournamentId?: string | null // 长效锦标赛引用
    ourScore?: number | null
    theirScore?: number | null
    cost?: number // 热身水杂费
    result?: string | null // "WIN", "DRAW", "LOSS"
    attendances?: { userId: string, goals: number, assists: number, fee?: number }[]
}

export async function getMatches() {
    return await prisma.match.findMany({
        orderBy: { date: 'desc' },
        include: {
            attendances: true
        }
    })
}

export async function getMatch(id: string) {
    return await prisma.match.findUnique({
        where: { id },
        include: {
            attendances: {
                include: { user: true }
            }
        }
    })
}

export async function saveMatch(data: MatchInput) {
    const { id, date, opponent, type, leagueName, tournamentId, ourScore, theirScore, cost, result, attendances = [] } = data
    const parsedDate = new Date(date)

    // 1. 数据落库比赛场次及出场大名单
    let savedMatchId = id
    if (id) {
        await prisma.match.update({
            where: { id },
            data: {
                date: parsedDate, opponent, type,
                leagueName, tournamentId, ourScore, theirScore, cost, result
            }
        })
        await prisma.attendance.deleteMany({ where: { matchId: id } })
        if (attendances.length > 0) {
            await prisma.attendance.createMany({
                data: attendances.map(att => ({
                    matchId: id,
                    userId: att.userId,
                    goals: att.goals || 0,
                    assists: att.assists || 0,
                    fee: att.fee || 0
                }))
            })
        }
    } else {
        const newMatch = await prisma.match.create({
            data: {
                date: parsedDate, opponent, type,
                leagueName, tournamentId, ourScore, theirScore, cost, result,
                attendances: {
                    create: attendances.map(att => ({
                        userId: att.userId,
                        goals: att.goals || 0,
                        assists: att.assists || 0,
                        fee: att.fee || 0
                    }))
                }
            }
        })
        savedMatchId = newMatch.id
    }

    // 2. 只有在此次操作是为 FRIENDLY 记账时，才产生账目波动向【会员费余额】进行求偿或结余
    // 第1步：无脑洗掉原来曾在这个 matchId 上报出的兜底/进账单（保证幂等重开）
    if (savedMatchId) {
        await prisma.memberFundTransaction.deleteMany({
            where: { matchId: savedMatchId }
        })
        // 尝试清理由于该场比赛触发的赞助费兜底划转款账单
        await prisma.teamFundTransaction.deleteMany({
            where: {
                category: "会员费兜底",
                description: { contains: `[Ref:${savedMatchId}]` }
            }
        })
    }

    if (type === 'FRIENDLY' && savedMatchId) {
        const totalCost = cost || 0
        const totalCollected = attendances.reduce((acc, curr) => acc + (curr.fee || 0), 0)
        const diff = totalCollected - totalCost

        if (Math.abs(diff) > 0.01) {
            // 如果盈余归公（INCOME），如果亏损从会费池贴钱扣除（EXPENSE）
            await prisma.memberFundTransaction.create({
                data: {
                    date: parsedDate,
                    totalAmount: Math.abs(diff),
                    type: diff > 0 ? "INCOME" : "EXPENSE",
                    description: `热身赛自动${diff > 0 ? '结余入账' : '兜底支出'} (${date} ${opponent})`,
                    matchId: savedMatchId
                }
            })

            // === [新增] 检查会员费池是否被击穿（为负） ===
            const allMemberTxs = await prisma.memberFundTransaction.findMany()
            const currentBalance = allMemberTxs.reduce((sum, tx) => sum + (tx.type === 'INCOME' ? tx.totalAmount : -tx.totalAmount), 0)

            if (currentBalance < -0.01) {
                const compensation = Math.abs(currentBalance)

                // 1. 会员资金流水自动增加一条记录：赞助费转账，填平负数使得目前结余为0
                await prisma.memberFundTransaction.create({
                    data: {
                        date: parsedDate,
                        totalAmount: compensation,
                        type: "INCOME",
                        description: "赞助费转账",
                        matchId: savedMatchId
                    }
                })

                // 2. 赞助费自动增加一条支出
                await prisma.teamFundTransaction.create({
                    data: {
                        amount: compensation, // 绝对值，正数
                        transactionType: "EXPENSE",
                        category: "会员费兜底",
                        description: `热身赛超支触发会员费池转账补偿 [Ref:${savedMatchId}]`,
                        date: parsedDate,
                        handlerName: "邹春朗"
                    }
                })

                // 3. 所有会员自动取消会员身份
                await prisma.user.updateMany({
                    where: { isMember: true },
                    data: { isMember: false }
                })
            }
        }
    }

    revalidatePath('/matches')
    revalidatePath('/finance') // 新增了对资金池的拨打，联动更新财产大盘
    revalidatePath('/') // 首页累计比赛等
}

export async function deleteMatch(id: string) {
    // 级连删除关联到本赛场的财务台账和出场名单
    await prisma.memberFundTransaction.deleteMany({
        where: { matchId: id }
    })
    await prisma.teamFundTransaction.deleteMany({
        where: {
            category: "会员费兜底",
            description: { contains: `[Ref:${id}]` }
        }
    })
    await prisma.attendance.deleteMany({
        where: { matchId: id }
    })

    await prisma.match.delete({
        where: { id }
    })

    revalidatePath('/matches')
    revalidatePath('/finance')
    revalidatePath('/')
}

export async function getLeagueNames() {
    // 拉取目前被记录过的所有独特的赛事名称
    const matches = await prisma.match.findMany({
        where: {
            type: 'LEAGUE',
            leagueName: { not: null }
        },
        select: {
            leagueName: true
        },
        distinct: ['leagueName']
    })

    return matches.map(m => m.leagueName as string).filter(Boolean)
}
