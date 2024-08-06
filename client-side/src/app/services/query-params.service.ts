import { Injectable } from '@angular/core';
import { IPageState } from 'shared';

export interface IPageQueryParams {
    [key: string]: any;
    blocksState?: any;
}

@Injectable({
    providedIn: 'root',
})
export class QueryParamsService {
    
    getQueryParamsFromState(state: IPageState): IPageQueryParams {
        const pageParameters = state.PageParameters;
        const blocksState = state.BlocksState;
        const blocksStateHasValue = blocksState && Object.keys(blocksState).length > 0;

        // Construct blocksState and pageParameters to queryParams
        return { 
            ...pageParameters,
            ...(blocksStateHasValue && { blocksState: JSON.stringify(blocksState) })
        };
    }

    getStateFromQueryParams(queryParams: IPageQueryParams): IPageState {
        // Destruct the queryParams to blocksState and pageParameters
        const { blocksState, ...pageParameters } = queryParams;
        
        let initialPageState: IPageState;
        
        // Parse the blocksState if it exists
        try {
            initialPageState = {
                PageParameters: pageParameters,
                BlocksState: JSON.parse(blocksState || "{}")
            }
        } catch (error) {
            // If the blocksState is not a valid JSON, set it to an empty object
            initialPageState = {
                PageParameters: pageParameters,
                BlocksState: {}
            }
        }

        return initialPageState;
    }
}