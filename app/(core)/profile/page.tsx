import Button from "@comps/client/button";
import ProfileClient, { RecipeClientTab } from "./client";
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Profile",
    description: "Profile page.",
}

export default async function ProfilePage() {

    return (
        <>
            <ProfileClient className="flex flex-col w-full gap-12 p-4 lg:flex-row" />
            <RecipeClientTab />
        </>
    );
}
