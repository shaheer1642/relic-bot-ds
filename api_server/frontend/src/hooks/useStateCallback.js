import { useEffect, useRef, useState, useCallback } from "react";

function useStateCallback(initialState) {
  const [state, setState] = useState(initialState);
  const cbRef = useRef(null); // init mutable ref container for callbacks

  const setStateCallback = useCallback((state, cb) => {
    cbRef.current = cb; // store current, passed callback in ref
    setState(state);
  }, []); // keep object reference stable, exactly like `useState`

  useEffect(() => {
    // cb.current is `null` on initial render, 
    // so we only invoke callback on state *updates*
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null; // reset callback after execution
    }
  }, [state]);

  return [state, setStateCallback];
}

export {useStateCallback}

// export const useStateCallback = (initilValue, callBack) => {
//   const [state, setState] = useState(initilValue);
//   useEffect(() => callBack? callBack(state): undefined, [state, callBack]);
//   return [state, setState];
// };
