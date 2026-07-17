"use server"

import prisma from '../prisma'

export type ScoreDetail = {
    ruleKey: string
    ruleName: string
    points: number
    matchId?: string
    matchName?: string
    date?: Date
}

export type PlayerScore = {
    total: number
    details: ScoreDetail[]
}

export async function getPlayerScores(userId?: string): Promise<Record<string, PlayerScore>> {
    const rules = await prisma.scoreRule.findMany({
        where: { isActive: true }
    });
    
    const ruleMap = new Map(rules.map(r => [r.key, r]));

    const whereClause = userId ? { userId } : {};
    
    const attendances = await prisma.attendance.findMany({
        where: whereClause,
        include: {
            match: true
        }
    });

    const scores: Record<string, PlayerScore> = {};

    for (const att of attendances) {
        if (!scores[att.userId]) {
            scores[att.userId] = { total: 0, details: [] };
        }
        
        const userScore = scores[att.userId];
        const m = att.match;
        const isLeague = m.type === 'LEAGUE';
        const matchName = `${isLeague ? (m.leagueName || '高校联赛') : '热身赛'} vs ${m.opponent}`;

        const addScore = (ruleKey: string, times: number = 1) => {
            const rule = ruleMap.get(ruleKey);
            if (rule && times > 0) {
                const pts = rule.type === 'PLUS' ? rule.points * times : -rule.points * times;
                userScore.total += pts;
                userScore.details.push({
                    ruleKey,
                    ruleName: rule.name + (times > 1 ? ` x${times}` : ''),
                    points: pts,
                    matchId: m.id,
                    matchName,
                    date: m.date
                });
            }
        };

        // 1. 高校联赛出勤 (只给未鸽子的人发)
        if (isLeague && !att.isNoShow) {
            addScore('LEAGUE_ATTENDANCE');
        }
        
        // 2. 热身赛出勤
        if (!isLeague && !att.isNoShow) {
            addScore('FRIENDLY_ATTENDANCE');
        }

        // 3. 联赛进球
        if (isLeague && att.goals > 0) {
            addScore('LEAGUE_GOAL', att.goals);
        }

        // 4. 联赛助攻
        if (isLeague && att.assists > 0) {
            addScore('LEAGUE_ASSIST', att.assists);
        }

        // 5. 取胜守门员 (仅限联赛)
        if (isLeague && att.isGK && m.result === 'WIN') {
            addScore('WINNING_GK');
        }

        // 6. 迟到
        if (att.isLate) {
            addScore('LATE');
        }

        // 7. 空降
        if (att.isDropIn) {
            addScore('DROP_IN');
        }

        // 8. 鸽子
        if (att.isNoShow) {
            addScore('NO_SHOW');
        }
    }

    for (const key in scores) {
        scores[key].details.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return b.date.getTime() - a.date.getTime();
        });
    }

    return scores;
}
