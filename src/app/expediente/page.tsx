import { readData } from "@/lib/actions";
import type { CauRequest } from "@/lib/types";
import ExpedienteClientPage from "./components/expediente-client-page";

export default async function ExpedientePage() {
    const allRequests = await readData<CauRequest[]>('cau-requests.json');

    return <ExpedienteClientPage allRequests={allRequests} />;
}
