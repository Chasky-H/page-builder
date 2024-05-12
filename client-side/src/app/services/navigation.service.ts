import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';

import { filter } from 'rxjs/operators';
import { config } from '../common/addon.config';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private history: string[] = []

    private _addonUUID = '';
    get addonUUID(): string {
        return this._addonUUID;
    }

    private _devServer = false;
    get devServer(): boolean {
        return this._devServer;
    }

    private _devBlocks: Map<string, string>; // Map<Component name, Host name>
    get devBlocks(): Map<string, string> {
        return this._devBlocks;
    }

    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {
        // Get the addonUUID from the root config.
        this._addonUUID = config.AddonUUID;
        // this._devServer = this.route.snapshot.queryParamMap.get('devServer') === 'true';
        const urlParams = this.getQueryParamsAsObject();
        this._devServer = urlParams['devServer'] === 'true';

        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            this.history.push(event.urlAfterRedirects);
        });

        this.loadDevBlocks();
    }

    private paramsToObject(entries) {
        const result = {}
        for(const [key, value] of entries) { // each 'entry' is a [key, value] tupple
          result[key] = value;
        }
        return result;
    }

    private loadDevBlocks() {
        try {
            // const devBlocksAsJSON = JSON.parse(this.route.snapshot.queryParamMap.get('devBlocks'));
            const urlParams = this.getQueryParamsAsObject();
            const devBlocksAsJSON = JSON.parse(urlParams['devBlocks']);
            this._devBlocks = new Map(devBlocksAsJSON);
        } catch(err) {
            this._devBlocks = new Map<string, string>();
        }
    }

    private getCurrentRoute(route: ActivatedRoute) {
        return {
            ...route,
            ...route.children.reduce((acc, child) =>
            ({ ...this.getCurrentRoute(child), ...acc }), {}) 
        };
    }

    back(): Promise<boolean> {
        this.history.pop();
        
        if (this.history.length > 0) {
            this.history.pop();
        }
        
        const route: ActivatedRoute = this.getCurrentRoute(this.route);
        return this.router.navigate(['../'], {
            relativeTo: route,
            queryParamsHandling: 'merge'
        });
    }

    navigateToPage(pageKey: string): Promise<boolean> {
        const route: ActivatedRoute = this.getCurrentRoute(this.route);
        return this.router.navigate([`${pageKey}`], {
            relativeTo: route,
            queryParamsHandling: 'merge'
        });;
    }

    getQueryParamsAsObject(): any {
        const queryParamsAsObject = this.paramsToObject(new URLSearchParams(location.search));
        return queryParamsAsObject;
    }

    updateQueryParams(queryParams: any, replaceUrl: boolean) {
        this.router.navigate([], { 
            queryParams: queryParams, 
            queryParamsHandling: 'merge',
            replaceUrl: replaceUrl
        });
    }

    // We don't need this anymore, because we are using the connectRouter from ngx-lib -> Addon service when creating new element.
    // Commented in version 2.5.11
    initRouterToRoot() {
        if (this.router) {
            // debugger;
            // this.router.initialNavigation();
            // const route: ActivatedRoute = this.getCurrentRoute(this.route);

            // this.router.navigate(['../'], {
            //     relativeTo: route,
            //     skipLocationChange: true
            // });
        }
    }
}
