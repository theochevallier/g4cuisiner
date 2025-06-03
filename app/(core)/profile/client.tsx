"use client";

import { DeleteRecipeById, SelectRecipeByUserId } from "@actions/database/Recipe";
import { UpdateUser } from "@actions/database/User";
import { ReturnRecipeType } from "@actions/types/Recipe";
import Button from "@comps/client/button";
import PasswordClient from "@comps/client/password";
import FormFeedback, { FormFeedbackProps } from "@comps/server/form-feedback";
import LoadingButton from "@comps/server/loading-button";
import { changeEmail, updateUser, useSession, changePassword, signOut } from "@lib/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { set } from "zod";

type ProfileClientProps = {
    className?: string;
};

export default function ProfileClient(props : ProfileClientProps) {
    const { className } = props;
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingPwd, setLoadingPwd] = useState(false);

    const [mode, setMode] = useState<FormFeedbackProps["mode"]>("hidden");
    const [modeEmail, setModeEmail] = useState<FormFeedbackProps["mode"]>("hidden");
    const [modePwd, setModePwd] = useState<FormFeedbackProps["mode"]>("hidden");

    const [message, setMessage] = useState("");
    const [messageEmail, setMessageEmail] = useState("");
    const [messagePassword, setMessagePassword] = useState("");
    const { data: session } = useSession();

    // Inputs states
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");

    // Initialisation des inputs quand la session est chargée
    useEffect(() => {
        if (session?.user?.name) {
            const [first, ...rest] = session.user.name.split(" ");
            setFirstname(first || "");
            setLastname(rest.join(" ") || "");
            setEmail(session.user.email || "");
            setPassword("");
        }
    }, [session]);

    const UpdateProfile = async () => {
        // Start loading
        setLoading(true);

        if(session === null) {
            return;
        }

        const user = await updateUser({
            name: `${firstname} ${lastname}`,
        });
        if(user.data?.status === true){
            setMode("success");
            setMessage("Profil mis à jour.");
            setLoading(false);
            setTimeout(async () => {
                window.location.reload();
            }, 1000);
        } else {
            setMode("danger");
            setMessage("Erreur lors de la mise à jour du profil.");
        }
        setLoading(false);
    };

    const UpdateEmail = async () => {
        setLoadingEmail(true);

        if(session === null) {
            return;
        }

        const user = await changeEmail({
            newEmail: email,
        });
        if(user.data?.status === true){
            setModeEmail("success");
            setMessageEmail("Email mis à jour.");
            setLoading(false);
            setTimeout(async () => {
                await signOut();
                router.push("/login");
            }, 1000);
        } else {
            setModeEmail("danger");
            setMessage("Erreur lors de la mise à jour de l'email.");
        }
        setLoadingEmail(false);
    }

    const UpdatePassword = async () => {
        setLoadingPwd(true);

        if(session === null) {
            return;
        }

        const user = await changePassword({
            newPassword: password,
            currentPassword: currentPassword,
            revokeOtherSessions: true,
        });
        if(user.data?.user){
            setModePwd("success");
            setMessagePassword("Mot de passe mis à jour.");
            setLoadingPwd(false);
            setTimeout(async () => {
                await signOut();
                router.push("/login");
            }, 1000);
        } else {
            setModePwd("danger");
            setMessagePassword("Erreur lors de la mise à jour du mot de passe : " + user.error?.message);
        }
        setLoadingPwd(false);
    }

    return (
        <>
        <div className="w-full space-y-4 p-4">
            <h3 className="text-2xl font-bold">Gestion de mon profil</h3>
        </div>
        <div className={className}>
                <section className="flex w-full flex-col items-center justify-center gap-4">
                    <h2 className="text-xl font-bold">Informations</h2>
                    <p className="text-center text-xs text-gray-500">Mettre à jours ses informations personnelles.</p>
                    <label className="flex w-full flex-col gap-1">
                        Prénom
                        <input
                            className="rounded border px-2 outline-none ring-teal-400 ring-offset-2 transition-all duration-150 focus:ring-2"
                            name="firstname"
                            type="firstname"
                            required
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            autoFocus
                        />
                    </label>
                    <label className="flex w-full flex-col gap-1">
                        Nom
                        <input
                            className="rounded border px-2 outline-none ring-teal-400 ring-offset-2 transition-all duration-150 focus:ring-2"
                            name="lastname"
                            type="lastname"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            required
                        />
                    </label>
                    <FormFeedback mode={mode}>{message}</FormFeedback>
                    <LoadingButton type="button" onClick={UpdateProfile} label="Mettre à jour" loading={loading} />
                </section>

                <section className="flex w-full flex-col items-center justify-center gap-4">
                    <h2 className="text-xl font-bold">Mettre à jour l'email</h2>
                    <p className="text-center text-xs text-gray-500">Cette action vous deconnectera.</p>
                    <label className="flex w-full flex-col gap-1">
                        Email
                        <input
                            className="rounded border px-2 outline-none ring-teal-400 ring-offset-2 transition-all duration-150 focus:ring-2"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label className="flex w-full flex-col gap-1 text-white">
                        empty
                        <input className="" name="null"/>
                    </label>

                    <FormFeedback mode={modeEmail}>{messageEmail}</FormFeedback>
                    <LoadingButton type="button" onClick={UpdateEmail} label="Mettre à jour" loading={loadingEmail} />
                </section>

                <section className="flex w-full flex-col items-center justify-center gap-4">
                    <h2 className="text-xl font-bold">Mettre à jour le mot de passe</h2>
                    <p className="text-center text-xs text-gray-500">Cette action vous deconnectera.</p>
                    <label className="flex w-full flex-col gap-1">
                        Mot de passe actuel
                        <input
                            className="rounded border px-2 outline-none ring-teal-400 ring-offset-2 transition-all duration-150 focus:ring-2"
                            name="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </label>
                    <label className="flex w-full flex-col gap-1">
                        Nouveau mot de passe
                        <PasswordClient
                            className="rounded border px-2 outline-none ring-teal-400 ring-offset-2 transition-all duration-150 focus:ring-2"
                            name="password"
                            required
                            autoComplete="off"
                            password={password}
                            setPassword={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    <FormFeedback mode={modePwd}>{messagePassword}</FormFeedback>
                    <LoadingButton type="button" onClick={UpdatePassword} label="Mettre à jour" loading={loadingPwd} />
                </section>
        </div>
        </>
    );
}

export function RecipeClientTab() {
    const { data: session } = useSession();
    const router = useRouter();
    const [recipesList, setRecipesList] = useState<ReturnRecipeType[]>([]);

    useEffect(() => {
        if (session?.user?.id) {
            (async () => {
                const recipeList = await SelectRecipeByUserId(session.user.id);
            setRecipesList(recipeList ?? []);
            })();
        }
    }, [session?.user?.id]);

    const handleEditRecipe = async (recipeSlug: string) => {
        router.push(`/recipe/${recipeSlug}`);
    };

    const handleDeleteRecipe = async (recipeId: string) => {
        Swal.fire({
            title: "Etes vous surs de vouloir supprimer cette recette ?",
            icon: "warning",
            showDenyButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Supprimer",
            denyButtonText: `Annuler`
            }).then(async(result) => {
            if (result.isConfirmed) {
                await DeleteRecipeById(recipeId);
                setRecipesList((prevList) => prevList.filter((recipe) => recipe.id !== recipeId));
            }
        });
    };

    return (
        <div className="w-full space-y-4 p-4 pt-8">
                    <h3 className="text-2xl font-bold">Gestion de mes recettes</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                            <thead>
                                <tr>
                                    <th className="border-b px-4 py-2 text-left">Nom</th>
                                    <th className="border-b px-4 py-2 text-left">Description</th>
                                    <th className="border-b px-4 py-2 text-left">Créé le</th>
                                    <th className="border-b px-4 py-2 text-left">Mis à jour le</th>
                                    <th className="border-b px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipesList.map((recipe) => (
                                    <tr key={recipe.id}>
                                        <td className="border-b px-4 py-2">{recipe.title}</td>
                                        <td className="border-b px-4 py-2">{recipe.description}</td>
                                        <td className="border-b px-4 py-2">
                                        {recipe.createdAt ? new Date(recipe.createdAt).toLocaleString() : ""}
                                        </td>
                                        <td className="border-b px-4 py-2">
                                        {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleString() : ""}
                                        </td>
                                        <td className="border-b px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="default"
                                                        className="bg-green-100 text-green-600 hover:bg-green-200"
                                                        onClick={() => handleEditRecipe(recipe.slug)}
                                                    >
                                                        Editer
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        className="bg-red-100 text-red-600 hover:bg-red-200"
                                                        onClick={() => handleDeleteRecipe(recipe.id)}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
    )
}