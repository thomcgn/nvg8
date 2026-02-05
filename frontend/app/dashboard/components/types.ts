export type CaseStatus =
    | "AKUT"
    | "BEOBACHTUNG"
    | "RUHEND"
    | "ABGESCHLOSSEN";

export interface Case {
    id:number;
    childName:string;
    age:number;
    status:CaseStatus;
    lastActivity:string;
}