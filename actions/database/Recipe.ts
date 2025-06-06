"use server";

import Prisma from "@lib/prisma";
import {
    IdRecipeType,
    CreateRecipeType,
    ReturnRecipeType,
    TitleRecipeType,
    SlugRecipeType,
    TitleAndSlugRecipeType,
    UpdateRecipeType,
    CompleteRecipeType,
    ReturnSelectLastRecipe,
    SelectRecipeByFilterType,
    ReturnSelectRecipeByFilterType,
    SelectEveryRecipeType,
} from "@actions/types/Recipe";
import ToSlug from "@actions/utils/ToSlug";

export const CreateRecipe = async (props: CreateRecipeType): Promise<ReturnRecipeType | null> => {
    try {
        const {
            title,
            description,
            numberOfServing,
            preparationTime,
            difficultyLevel,
            lunchType,
            lunchStep,
            userId,
            instructions,
            imageNameList,
            ingredientList,
        } = props;
        // Check if recipe already exists
        const existingRecipe = await SelectRecipeByTitle({ title });
        if (existingRecipe) {
            throw new Error("Recipe already exists");
        }

        // Create slug
        const slug = ToSlug(title);

        // Check if slug already exists
        const existingSlug = await SelectRecipeBySlug({ slug });
        if (existingSlug) {
            throw new Error("Slug already exists");
        }

        // Create recipe
        const recipe = await Prisma.recipe.create({
            data: {
                title,
                slug,
                description,
                numberOfServing,
                preparationTime,
                difficultyLevel,
                lunchType,
                lunchStep,
                instructions,
                userId,
                Image: {
                    create: imageNameList.map((name, index) => {
                        // Get image extension
                        const imageExtensionIndex = name.lastIndexOf(".");
                        const imageExtension = name.slice(imageExtensionIndex + 1);

                        // Create complete image name
                        const newImageName = slug + "-" + (index + 1) + "." + imageExtension;
                        return {
                            url: `/recipes/${newImageName}`,
                            alt: title + "-" + (index + 1),
                        };
                    }),
                },
                Quantity: {
                    create: ingredientList.map(({ quantity, unit, ingredientId }) => ({
                        quantity,
                        unit,
                        ingredientId,
                    })),
                },
            },
        });
        return recipe;
    } catch (error) {
        console.log(error);
        return null;
        // throw new Error("CreateRecipe -> " + (error as Error).message);
    }
};

export const SelectRecipeById = async (props: IdRecipeType): Promise<ReturnRecipeType | null> => {
    try {
        const { id } = props;
        const recipe = await Prisma.recipe.findUnique({
            where: {
                id,
            },
        });
        if (!recipe) {
            return null;
        }
        return recipe;
    } catch (error) {
        throw new Error("SelectRecipeById -> " + (error as Error).message);
    }
};

export const SelectRecipeByTitle = async (props: TitleRecipeType): Promise<ReturnRecipeType | null> => {
    try {
        const { title } = props;
        const recipe = await Prisma.recipe.findUnique({
            where: {
                title,
            },
        });
        if (!recipe) {
            return null;
        }
        return recipe;
    } catch (error) {
        throw new Error("SelectRecipeByTitle -> " + (error as Error).message);
    }
};

export const SelectRecipeBySlug = async (props: SlugRecipeType): Promise<CompleteRecipeType | null> => {
    try {
        const { slug } = props;
        const recipe = await Prisma.recipe.findUnique({
            where: {
                slug,
                status: "APPROVED",
            },
            include: {
                User: {
                    select: {
                        name: true,
                    }
                },
                Image: {
                    select: {
                        url: true,
                        alt: true,
                    },
                },
                Favorite: {
                    select: {
                        favorite: true,
                    },
                },
                Review: {
                    select: {
                        id: true,
                        userId: true,
                        review: true,
                        User: {
                            select: {
                                id: true,
                                name: true,
                                Rating: {
                                    select: {
                                        rating: true,
                                    },
                                    where: {
                                        Recipe: {
                                            slug,
                                        },
                                    },
                                },
                            },
                        },
                        thumbsPositive: {
                            select: {
                                id: true,
                            },
                        },
                        thumbsNegative: {
                            select: {
                                id: true,
                            },
                        },
                        createdAt: true,
                    },
                },
                Rating: {
                    select: {
                        rating: true,
                    },
                },
                Quantity: {
                    select: {
                        quantity: true,
                        unit: true,
                        ingredientId: true,
                        ingredient: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });
        if (!recipe) {
            return null;
        }
        // Calculate average rating
        const notNullRatingList = recipe.Rating.map(({ rating }) => rating).filter((rating) => typeof rating === "number" && rating !== null);

        const ratingAverage =
            notNullRatingList.length === 0
                ? 0
                : Math.round(
                    notNullRatingList.reduce((acc, rate) => acc + rate, 0) / notNullRatingList.length
                );

        // Clamp entre 0 et 5 (au cas où)
        const ratingAverageClamped = Math.max(0, Math.min(5, ratingAverage));

        const totalFavoriteAmount = recipe.Favorite.filter(({ favorite }) => favorite).length;
        const totalRatingAmount = recipe.Rating.length;

        const recipeFormatted = {
            id: recipe.id,
            title: recipe.title,
            slug: recipe.slug,
            description: recipe.description,
            numberOfServing: recipe.numberOfServing,
            preparationTime: recipe.preparationTime,
            difficultyLevel: recipe.difficultyLevel,
            lunchType: recipe.lunchType,
            lunchStep: recipe.lunchStep,
            instructions: recipe.instructions,
            status: recipe.status,
            userId: recipe.userId,
            userName: recipe.User.name,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            ratingAverage,
            totalFavoriteAmount,
            totalRatingAmount,
            imageList: recipe.Image,
            reviewList: recipe.Review.map(
                ({ id, userId, User, review, thumbsPositive, thumbsNegative, createdAt }) => ({
                    reviewId: id,
                    userId: userId,
                    name: User.name,
                    rating: User.Rating?.[0]?.rating, // TODO : check if correct
                    review: review,
                    thumbsPositive: thumbsPositive.length,
                    thumbsNegative: thumbsNegative.length,
                    createdAt: createdAt,
                })
            ),
            ingredientList: recipe.Quantity.map(({ ingredientId, ingredient, quantity, unit }) => ({
                ingredientId: ingredientId,
                name: ingredient.name,
                description: ingredient.description,
                image: ingredient.image,
                quantity: quantity,
                unit: unit,
            })),
        };
        return recipeFormatted;
    } catch (error) {
        throw new Error("SelectRecipeBySlug -> " + (error as Error).message);
    }
};

export const SelectEveryRecipeSlugs = async (): Promise<TitleAndSlugRecipeType[] | null> => {
    try {
        const recipeList = await Prisma.recipe.findMany({
            where: {
                status: "APPROVED",
            },
            select: {
                title: true,
                slug: true,
            },
        });
        if (recipeList.length === 0) {
            return null;
        }
        return recipeList;
    } catch (error) {
        throw new Error("SelectEveryRecipeSlugs -> " + (error as Error).message);
    }
};

export const SelectEveryRecipe = async (): Promise<SelectEveryRecipeType[] | null> => {
    try {
        const recipeList = await Prisma.recipe.findMany({
            where: {
                status: "APPROVED",
            },
            include: {
                Image: {
                    select: {
                        url: true,
                        alt: true,
                    },
                },
            },
        });
        if (recipeList.length === 0) {
            return null;
        }
        const recipeListFormatted = recipeList.map(
            ({ title, slug, lunchStep, lunchType, preparationTime, difficultyLevel, Image }) => ({
                title,
                preparationTime,
                difficultyLevel,
                lunchType,
                lunchStep,
                slug,
                imageList: (Image ?? []).map(({ url, alt }) => ({ url, alt })),
                // imageList: Image.map(({ url, alt }) => ({
                //     url,
                //     alt,
                // })),
            })
        );
        return recipeListFormatted;
    } catch (error) {
        throw new Error("SelectEveryRecipe -> " + (error as Error).message);
    }
};

export const SelectRecipeByFilter = async (
    props: SelectRecipeByFilterType
): Promise<ReturnSelectRecipeByFilterType[] | null> => {
    const { lunchType, lunchStep, preparationTime } = props;
    try {
        const recipeList = await Prisma.recipe.findMany({
            where: {
                lunchType: {
                    in: lunchType,
                },
                lunchStep: {
                    in: lunchStep,
                },
                ...(preparationTime !== undefined && {
                    preparationTime: {
                        lte: preparationTime, // TODO : check if correct
                    },
                }),
                status: "APPROVED",
            },
            include: {
                Image: {
                    select: {
                        url: true,
                        alt: true,
                    },
                },
                Rating: {
                    select: {
                        rating: true,
                    },
                },
            },
        });
        if (recipeList.length === 0) {
            return null;
        }
        const recipeListFormatted = recipeList.map((recipe) => {
            // Calculate average rating
            const notNullRatingList = recipe.Rating
                .map(({ rating }) => rating)
                .filter((rating) => typeof rating === "number" && rating !== null);
            const ratingAverage =
                notNullRatingList.length === 0
                    ? 0
                    : Math.round(
                        notNullRatingList.reduce((acc, rate) => acc + rate, 0) / notNullRatingList.length
                    );
            return {
                id: recipe.id,
                title: recipe.title,
                slug: recipe.slug,
                description: recipe.description,
                imageList: recipe.Image.map(({ url, alt }) => ({
                    url,
                    alt,
                })),
                ratingAverage,
            };
        });
        return recipeListFormatted;
    } catch (error) {
        throw new Error("SelectRecipeByFilter -> " + (error as Error).message);
    }
};

export const SelectLastRecipe = async (props: { limit: number }): Promise<ReturnSelectLastRecipe[] | null> => {
    try {
        const { limit = 10 } = props;
        const recipeList = await Prisma.recipe.findMany({
            where: {
                status: "APPROVED",
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                Image: true,
            },
            take: limit,
        });
        if (recipeList.length === 0) {
            return null;
        }
        const recipeListFormatted = recipeList.map((recipe) => ({
            title: recipe.title,
            slug: recipe.slug,
            imageList: recipe.Image.map(({ url, alt }) => ({
                url,
                alt,
            })),
        }));
        return recipeListFormatted;
    } catch (error) {
        throw new Error("SelectLastRecipe -> " + (error as Error).message);
    }
};

export const SelectEveryPendingRecipe = async (): Promise<ReturnRecipeType[] | null> => {
    try {
        const pendingRecipes = await Prisma.recipe.findMany({
            where: {
                status: "PENDING",
            },
        });
        if (pendingRecipes.length === 0) {
            return null;
        }
        return pendingRecipes;
    } catch (error) {
        throw new Error("SelectEveryPendingRecipe -> " + (error as Error).message);
    }
};

export const UpdateRecipeById = async (props: UpdateRecipeType): Promise<ReturnRecipeType | null> => {
    try {
        const { id, data } = props;
        const { title, ingredientList } = data;

        const existingRecipe = await SelectRecipeById({ id });
        if (!existingRecipe) {
            throw new Error("Recipe does not exist");
        }

        const isNewTitleAlreadyExists = title && (await SelectRecipeByTitle({ title }));
        if (isNewTitleAlreadyExists && isNewTitleAlreadyExists.id !== id) {
            throw new Error("New title already exists");
        }

        const recipe = await Prisma.recipe.update({
            where: { id },
            data: {
                title: title ?? existingRecipe.title,
                description: data.description ?? existingRecipe.description,
                numberOfServing: data.numberOfServing ?? existingRecipe.numberOfServing,
                preparationTime: data.preparationTime ?? existingRecipe.preparationTime,
                difficultyLevel: data.difficultyLevel ?? existingRecipe.difficultyLevel,
                lunchType: data.lunchType ?? existingRecipe.lunchType,
                lunchStep: data.lunchStep ?? existingRecipe.lunchStep,
                instructions: data.instructions ?? existingRecipe.instructions,
                status: data.status ?? existingRecipe.status,
                ...(ingredientList &&
                    ingredientList.length > 0 && {
                        Quantity: {
                            deleteMany: {},
                            create: ingredientList.map(({ quantity, unit, ingredientId }) => ({
                                quantity: quantity,
                                unit,
                                ingredientId,
                            })),
                        },
                    }),
            },
        });
        return recipe;
    } catch (error) {
        console.log(error);
        return null;
        // throw new Error("UpdateRecipeById -> " + (error as Error).message);
    }
};

export const SelectRecipeByUserId = async ( userId : string): Promise<ReturnRecipeType[] | null> => {
    if(!userId) {
        throw new Error("SelectRecipeByUserId -> userId is required");
    }

    try {
        const recipeList = await Prisma.recipe.findMany({
            where: {
                userId,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        if (recipeList.length === 0) {
            return null;
        }
        return recipeList;
    } catch (error) {
        throw new Error("SelectRecipeByUserId -> " + (error as Error).message);
    }
}

export const DeleteRecipeById = async (id: string): Promise<ReturnRecipeType | null> => {
    try {
        const recipe = await Prisma.recipe.delete({
            where: {
                id,
            },
        });
        if (!recipe) {
            return null;
        }
        return recipe;
    } catch (error) {
        throw new Error("DeleteRecipeById -> " + (error as Error).message);
    }
};