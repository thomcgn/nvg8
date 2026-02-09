"use client"
import CaseWizard from "@/app/cases/components/CaseWizard";
import {useRouter} from "next/navigation";
export default function NewCasePage(){
    const router = useRouter();
    return(
        <CaseWizard onCancel={() =>router.push("/dashboard")}
                    />
    )
}