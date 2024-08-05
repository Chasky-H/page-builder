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

    private objectToParams(queryParameters) {
        // const objectToQueryString = queryParameters => {
            return queryParameters
            ? Object.entries(queryParameters).reduce(
                (queryString, [key, val], index) => {
                    const symbol = queryString.length === 0 ? '?' : '&';
                    queryString +=
                    typeof val === 'string' ? `${symbol}${key}=${val}` : '';
                    return queryString;
                },
                ''
                )
            : '';
        // };

        // return objectToQueryString
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
            // queryParamsHandling: 'merge' // Comment this in 2.5.11 for clear all query params when navigating back.
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
        // debugger;
        // const route: ActivatedRoute = this.getCurrentRoute(this.route);
        const url = location.pathname; // This for fix the routing issue (DI-28206) - navigate from page to another page cause the routing to changed back after update the QS.
        // this.router.navigate([url], { 
        //     // relativeTo: route,
        //     queryParams: queryParams, 
        //     queryParamsHandling: 'merge',
        //     replaceUrl: replaceUrl
        // });

        // Update the QS params in the URL with 'navigateTo' webapp event (for keep the back button of the browser alive).
        const qsParams = this.objectToParams(queryParams);
        const eventData = {
            detail: {
                path: url + qsParams,
            },
        };

        const customEvent = new CustomEvent('navigateTo', eventData);
        window.dispatchEvent(customEvent);
        
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
