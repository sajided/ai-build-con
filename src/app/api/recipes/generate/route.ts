import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateDiabeticRecipes } from "@/lib/ai/recipe-generator";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const generateRecipeRequestSchema = z.object({
  items: z.array(z.string().min(1)).min(1, "At least one ingredient is required"),
  pantryStaples: z.array(z.string()).optional(),
  saveToProfile: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateRecipeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { items, saveToProfile } = parsed.data;

    // Generate and clinically audit recipes
    const { recipes } = await generateDiabeticRecipes(items);

    // Optional Supabase persistence if user is logged in
    const user = await getCurrentUser();
    if (user && saveToProfile) {
      try {
        const supabase = createClient();
        await supabase.from("recipes").insert(
          recipes.map((r) => ({
            user_id: user.id,
            title: r.title,
            description: r.description,
            glycemic_impact: r.glycemic_impact,
            macros: r.macros,
            ingredients: r.ingredients,
            instructions: r.instructions,
            eating_sequence: r.eating_sequence,
          }))
        );
      } catch (err: unknown) {
        console.warn("[Recipe Persistence Notice - Non-blocking]:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: recipes.length,
        recipes,
        ingredients_input: items,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Recipe Generation Route Error]:", error);
    return NextResponse.json(
      {
        error: "Internal server error during recipe generation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
