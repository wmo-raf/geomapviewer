import { createAction, createThunkAction } from "@/redux/actions";

import { checkLoggedIn, getProfile } from "@/services/user";

const isServer = typeof window === "undefined";

export const setAuthLoading = createAction("setAuthLoading");
export const setAuth = createAction("setAuth");

export const getUserProfile = createThunkAction(
  "getUserProfile",
  (urlToken) => (dispatch) => {
    const token = !isServer && (urlToken || localStorage.getItem("userToken"));

    if (token) {
      dispatch(setAuthLoading({ loading: true, error: false }));
      checkLoggedIn(token)
        .then((authResponse) => {
          getProfile(authResponse.data.id)
            .then((response) => {
              if (response.status < 400 && response.data) {
                const { data } = response;

                dispatch(
                  setAuth({
                    loggedIn: true,
                    ...authResponse.data,
                    ...data,
                    id: data.user_id || authResponse.data.id,
                  })
                );
              }
            })
            .catch(() => {
              dispatch(
                setAuth({
                  loggedIn: true,
                  ...authResponse.data,
                })
              );
            });
        })
        .catch(() => {
          dispatch(setAuthLoading({ loading: false, error: true }));
        });
    }
  }
);
