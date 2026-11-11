import * as crypto from 'crypto'
import { prisma } from '../db/client.js'

function selectItemByChance(drops: Array<{ itemId: number; chance: number }>): number {
  const total = drops.reduce((sum, d) => sum + d.chance, 0)
  const randomBytes = crypto.randomBytes(4)
  const randomValue = randomBytes.readUInt32BE(0)
  let roll = randomValue % total
  for (const drop of drops) {
    if (roll < drop.chance) return drop.itemId
    roll -= drop.chance
  }
  return drops[drops.length - 1].itemId
}

export async function openCase(userId: number, caseId: number) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (user.isBanned) throw new Error('User is banned')

    const caseData = await tx.case.findUnique({
      where: { id: caseId },
      include: { drops: { include: { item: true } } },
    })
    if (!caseData || !caseData.isActive) throw new Error('Case not found or inactive')
    if (caseData.drops.length === 0) throw new Error('Case has no items configured')
    if (caseData.currency === 'stars') throw new Error('Stars payment not yet enabled for this case')

    if (caseData.price > 0) {
      if (caseData.currency === 'coins') {
        if (user.coins < caseData.price) throw new Error('Not enough coins')
        await tx.user.update({
          where: { id: userId },
          data: { coins: { decrement: caseData.price } },
        })
        await tx.transaction.create({
          data: {
            userId,
            type: 'case_open',
            amount: -caseData.price,
            currency: 'coins',
            description: `Открытие кейса "${caseData.name}"`,
          }
        })
      } else if (caseData.currency === 'tickets') {
        if (user.tickets < caseData.price) throw new Error('Not enough tickets')
        await tx.user.update({
          where: { id: userId },
          data: { tickets: { decrement: caseData.price } },
        })
        await tx.transaction.create({
          data: {
            userId,
            type: 'case_open',
            amount: -caseData.price,
            currency: 'tickets',
            description: `Открытие кейса "${caseData.name}"`,
          }
        })
      }
    }

    const wonItemId = selectItemByChance(caseData.drops)
    const wonItem = caseData.drops.find(d => d.itemId === wonItemId)!.item

    const userItem = await tx.userItem.create({
      data: {
        userId,
        itemId: wonItemId,
        obtainedFrom: 'case_opening',
      }
    })

    await tx.caseOpening.create({
      data: { userId, caseId, itemId: wonItemId }
    })

    const expGain = 10 + Math.floor(wonItem.gameValue / 50)
    await tx.user.update({
      where: { id: userId },
      data: { experience: { increment: expGain } },
    })

    const updatedUser = await tx.user.findUnique({ where: { id: userId } })

    return {
      userItem,
      item: wonItem,
      drops: caseData.drops.map(d => ({ item: d.item, chance: d.chance })),
      expGained: expGain,
      newBalance: {
        coins: updatedUser!.coins,
        tickets: updatedUser!.tickets,
      }
    }
  })
}
