import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewAddClient from "@comps/client/review-add";
import { useSession } from "@lib/client";
import { useStore } from "@lib/zustand";

// Mock les hooks et dépendances externes
jest.mock("@lib/client", () => ({
  useSession: jest.fn(),
}));
jest.mock("@lib/zustand", () => ({
  useStore: jest.fn(),
}));
jest.mock("@actions/database/Review", () => ({
  CreateReview: jest.fn().mockResolvedValue({
    id: "review-id",
    review: "Super recette !",
    createdAt: new Date(),
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("ReviewAddClient", () => {
  beforeEach(() => {
    // Mock la session utilisateur
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-id", name: "John Doe" },
      },
    });
    // Mock le store Zustand
    (useStore as jest.Mock).mockReturnValue({
      reviewListStore: [[]],
      setReviewListStore: jest.fn(),
    });
  });

  it("affiche le champ de saisie et le bouton", () => {
    render(<ReviewAddClient userRating={4} recipeId="recipe-1" />);
    expect(screen.getByLabelText(/écrire un commentaire/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();
  });

  it("permet de saisir et soumettre un commentaire", async () => {
    render(<ReviewAddClient userRating={5} recipeId="recipe-1" />);
    const input = screen.getByPlaceholderText(/j'ai adoré cette recette/i);
    fireEvent.change(input, { target: { value: "Super recette !" } });
    fireEvent.click(screen.getByRole("button", { name: /envoyer/i }));

    await waitFor(() => {
      expect(input).toHaveValue(""); // Le champ est vidé après soumission
    });
  });
});