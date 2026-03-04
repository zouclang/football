import { getDb } from '@/lib/sqlite'
import { MatchClient } from '@/components/MatchClient'
import { getSession } from '@/lib/auth'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function MatchesPage(props: { searchParams: Promise<{ tournamentId?: string, editMatchId?: string, year?: string, opponent?: string, page?: string, pageSize?: string }> }) {
    const session = await getSession()
    const { tournamentId, editMatchId, year, opponent, page, pageSize } = await props.searchParams

    const yearVal = year || 'ALL'
    const currentPage = Math.max(1, parseInt(page || '1', 10))
    const pageSizeVal = Math.min(100, Math.max(5, parseInt(pageSize || '10', 10)))
    const offset = (currentPage - 1) * pageSizeVal

    const db = getDb()

    // ─── 构建 WHERE 条件 ───────────────────────────────────────────
    const conditions: string[] = []
    const params: any[] = []

    if (tournamentId) {
        if (tournamentId === 'FRIENDLY') {
            conditions.push(`m.type = 'FRIENDLY'`)
        } else {
            conditions.push(`m.tournamentId = ?`)
            params.push(tournamentId)
        }
    }
    if (opponent) {
        conditions.push(`m.opponent LIKE ?`)
        params.push(`%${opponent}%`)
    }
    if (yearVal !== 'ALL') {
        if (yearVal === 'BEFORE_2026') {
            conditions.push(`m.date < '2026-01-01'`)
        } else {
            const y = parseInt(yearVal)
            conditions.push(`m.date >= '${y}-01-01' AND m.date < '${y + 1}-01-01'`)
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // ─── 并发查询（better-sqlite3 是同步的，直接执行即可）────────────
    const totalCount = (db.prepare(`SELECT COUNT(*) as cnt FROM "Match" m ${whereClause}`).get(...params) as any)?.cnt ?? 0

    // 当前页比赛
    const matchRows = db.prepare(`
        SELECT m.id, m.date, m.opponent, m.type, m.tournamentId, m.leagueName,
               m.ourScore, m.theirScore, m.result, m.cost, m.createdAt
        FROM "Match" m
        ${whereClause}
        ORDER BY m.date DESC
        LIMIT ? OFFSET ?
    `).all(...params, pageSizeVal, offset) as any[]

    // 每场比赛的考勤（仅当前页）
    const matchIds = matchRows.map(m => m.id)
    const attendanceMap = new Map<string, any[]>()
    if (matchIds.length > 0) {
        const placeholders = matchIds.map(() => '?').join(',')
        const attRows = db.prepare(`
            SELECT matchId, userId, goals, assists, fee
            FROM "Attendance"
            WHERE matchId IN (${placeholders})
        `).all(...matchIds) as any[]
        for (const a of attRows) {
            if (!attendanceMap.has(a.matchId)) attendanceMap.set(a.matchId, [])
            attendanceMap.get(a.matchId)!.push({ userId: a.userId, goals: a.goals, assists: a.assists, fee: a.fee })
        }
    }

    const matches = matchRows.map(m => ({
        ...m,
        attendances: attendanceMap.get(m.id) ?? []
    }))

    // 球员列表（不含 profilePhoto — base64 大图使 payload 膨胀至 100MB+）
    const players = db.prepare(`
        SELECT id, name, jerseyNumber, isActive, isRetired, isMember
        FROM "User"
        ORDER BY CASE WHEN jerseyNumber IS NULL OR jerseyNumber = '' THEN 1 ELSE 0 END,
                 CAST(jerseyNumber AS INTEGER), name
    `).all() as any[]

    // 未完结赛事（不包含球员，按需懒加载）
    const unfinishedTournaments = db.prepare(`
        SELECT id, name, startDate, endDate FROM "Tournament"
        WHERE finalRank IS NULL
        ORDER BY createdAt DESC
    `).all() as any[]

    // 所有赛事（仅用于筛选下拉）
    const allTournaments = db.prepare(`
        SELECT id, name FROM "Tournament"
        ORDER BY createdAt DESC
    `).all() as any[]

    // 当前筛选赛事名（若有）
    const filterTournament = tournamentId && tournamentId !== 'FRIENDLY'
        ? db.prepare(`SELECT id, name FROM "Tournament" WHERE id = ?`).get(tournamentId) as any
        : null

    // SQLite boolean → JS boolean
    const fixBool = (p: any) => ({ ...p, isActive: p.isActive === 1, isRetired: p.isRetired === 1, isMember: p.isMember === 1 })

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">加载中...</div>}>
            <MatchClient
                initialMatches={matches}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSizeVal}
                players={players.map(fixBool)}
                unfinishedTournaments={unfinishedTournaments}
                filterTournamentName={filterTournament?.name}
                autoEditMatchId={editMatchId}
                allTournaments={allTournaments}
                role={session?.role || 'player'}
            />
        </Suspense>
    )
}
