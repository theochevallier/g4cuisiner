import ProfileClient, { RecipeClientTab } from "./client";
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Profile",
    description: "Profile page.",
}

export default async function ProfilePage() {

    return (
        <>
            <ProfileClient className="w-full flex flex-col lg:flex-row gap-12 p-4" />
            <RecipeClientTab />
        </>
    );
}
