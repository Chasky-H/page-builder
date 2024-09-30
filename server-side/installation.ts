
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/
import { Client, Request } from '@pepperi-addons/debug-server'
import { PagesApiService } from './pages-api.service';
import { PagesUpgradeService } from './pages-upgrade.service';
import semver from 'semver';

const pnsKeyForPages = 'uninstall_blocks_subscription';
const pnsFunctionPathForPages = '/api/on_uninstall_block';
// const pnsKeyForDraftPages = 'uninstall_blocks_subscription_draft';
// const pnsFunctionPathForDraftPages = '/internal_api/on_uninstall_block_draft';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        await pageService.createPagesTablesSchemes();
        await pageService.upsertPagesRelations();
        await pageService.subscribeUninstallAddons(pnsKeyForPages, pnsFunctionPathForPages);
        // await pageService.subscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    try {
        // Remove this cause a bug in the system.
        // const pageService = new PagesApiService(client);
        // await pageService.unsubscribeUninstallAddons(pnsKeyForPages, pnsFunctionPathForPages);
        // await pageService.unsubscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
    } catch (err) {
        throw new Error(`Failed to unsubscribe from PNS. error - ${err}`);
    }
    
    return { success: true, resultObject: {} };
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        const pageService = new PagesApiService(client);
        await pageService.createPagesTablesSchemes();
        await pageService.upsertPagesRelations();

        const pageUpgradeService = new PagesUpgradeService(client);
        await pageUpgradeService.performMigration(request.body.FromVersion, request.body.ToVersion);

        // Example how to use migration code.
        // if (request.body.FromVersion && semver.compare(request.body.FromVersion, '0.7.61') < 0) {
        //     const pageUpgradeService = new PagesUpgradeService(client);
        //     await pageUpgradeService.upgradeToVersion61(true);
        // }
    } catch (err) {
        throw new Error(`Failed to upgrade to. error - ${err}`);
    }

    return { success:true, resultObject: {} };
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success:true, resultObject: {} };
}