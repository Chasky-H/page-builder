import fetch from "node-fetch";
import { Agent } from "https";

export class HTTPService {

    async apiCall(method: any, url: string, body: any = undefined,options: any): Promise<any> {

        const res = await fetch(url, options);
        if (!res.ok) {
            let error = '';
            try {
                error = JSON.stringify(await res.json());
            } catch {
                throw new Error(`${url} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
            }
        }
        return res;
    }
}
