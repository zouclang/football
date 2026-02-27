import prisma from './src/lib/prisma'
import { addDiningExpense } from './src/lib/actions/finance'

async function run() {
    console.log('--- Starting Dual Fund Finance Test ---')

    // Clean DB
    await prisma.personalTransaction.deleteMany()
    await prisma.teamFundTransaction.deleteMany()
    await prisma.attendance.deleteMany()
    await prisma.match.deleteMany()
    await prisma.user.deleteMany()

    // Create Users
    const u1 = await prisma.user.create({ data: { name: 'Player A', personalBalance: 50 } })
    const u2 = await prisma.user.create({ data: { name: 'Player B', personalBalance: 0 } })

    console.log('Initial Balances:')
    console.log(`Player A: ¥50.00`)
    console.log(`Player B: ¥0.00`)

    // Test case: Total config ¥250. 2 people. Raw share = ¥125. Capped at ¥100.
    // Team Fund should get the remaining ¥50 expense.
    console.log('\nRunning: addDiningExpense(250) for 2 users...')
    await addDiningExpense({
        totalAmount: 250,
        participantIds: [u1.id, u2.id],
        description: 'Post-match Dinner'
    })

    const updatedUsers = await prisma.user.findMany()
    const teamFunds = await prisma.teamFundTransaction.findMany()

    console.log('\nResults:')
    updatedUsers.forEach(u => {
        console.log(`- ${u.name} Balance: ¥${u.personalBalance}`)
    })
    teamFunds.forEach(t => {
        console.log(`- Team Fund Entry: ¥${t.amount} (${t.transactionType}) -> ${t.category}`)
    })

    // Assertions
    const a = updatedUsers.find(u => u.name === 'Player A')
    const b = updatedUsers.find(u => u.name === 'Player B')

    if (a!.personalBalance !== -50) throw new Error("A balance is wrong!")
    if (b!.personalBalance !== -100) throw new Error("B balance is wrong!")
    if (teamFunds[0].amount !== 50) throw new Error("Team Fund balance is wrong!")

    console.log('\n✅ All Dual-Fund Logic assertions passed!')
}

run()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
