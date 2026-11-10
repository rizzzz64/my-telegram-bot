import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client.js'

const craftSchema = z.object({
  recipeId: z.number().int().positive(),
  ingredientItemIds: z.array(z.number().int().positive()),
})

export async function craftRoutes(app: FastifyInstance) {
  app.get('/recipes', async (request, reply) => {
    const recipes = await prisma.craftRecipe.findMany({
      where: { isActive: true },
      include: {
        resultItem: true,
        ingredients: { include: { item: true } }
      }
    })
    return reply.send(recipes)
  })

  app.post('/', async (request, reply) => {
    const parsed = craftSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })
    const { recipeId, ingredientItemIds } = parsed.data
    const userId = request.userId!

    try {
      const result = await prisma.$transaction(async (tx) => {
        const recipe = await tx.craftRecipe.findUnique({
          where: { id: recipeId, isActive: true },
          include: { ingredients: true, resultItem: true }
        })
        if (!recipe) throw new Error('Recipe not found')

        const userItems = await tx.userItem.findMany({
          where: { id: { in: ingredientItemIds }, userId, status: 'active' }
        })
        if (userItems.length !== ingredientItemIds.length) throw new Error('Some items not found')

        await tx.userItem.updateMany({
          where: { id: { in: ingredientItemIds } },
          data: { status: 'used_craft' }
        })

        const resultUserItem = await tx.userItem.create({
          data: { userId, itemId: recipe.resultItemId, obtainedFrom: 'craft' }
        })

        const craft = await tx.craft.create({
          data: {
            userId,
            recipeId,
            success: true,
            ingredientUses: {
              create: userItems.map(ui => ({ userItemId: ui.id }))
            }
          }
        })

        return { success: true, item: recipe.resultItem, resultUserItem }
      })

      return reply.send(result)
    } catch (err: any) {
      return reply.status(400).send({ error: err?.message || 'Craft failed' })
    }
  })
}
