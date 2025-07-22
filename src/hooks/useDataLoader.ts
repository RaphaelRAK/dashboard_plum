import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useAppDispatch } from "./useAppDispatch";

export const useDataLoader = (options: {
    selector: (state: RootState) => any;
    fetchAction: () => any;
    cacheTimeout?: number;
  }) => {
    const [isActive, setIsActive] = useState(false);
    const dispatch = useAppDispatch();
    const data = useSelector(options.selector);
    const cacheTimeout = options.cacheTimeout || 5 * 60 * 1000;
  
    const loadData = useCallback(() => {
      if (!isActive) return;
  
      const now = Date.now();
      const hasData = Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0;
      
      if (!hasData || now - data.lastFetchTimestamp > cacheTimeout) {
        dispatch(options.fetchAction());
      }
    }, [isActive, data, dispatch, options.fetchAction, cacheTimeout]);
  
    useEffect(() => {
      setIsActive(true);
      return () => setIsActive(false);
    }, []);
  
    return { loadData, isActive, data };
  };