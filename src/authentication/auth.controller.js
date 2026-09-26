import * as authService from "./auth.service.js";




const login = async (req, res) =>
{
    const credentials = req.body;

    const userToken = await authService.login(credentials.email, credentials.password);

    res.status(200).json(userToken);
}



const refresh = async (req, res) =>
{
    const refreshToken = req.body.refreshToken;

    const newAccessToken = await authService.refresh(refreshToken);

    res.status(200).json({ accessToken: newAccessToken });
};
// we return an object as opposed to 'newAccessToken' which would just be a string. This is easier to extend later (adding more properties to the object, which we could not do if we were just returning the access token string) in case the Frontend needs more information along with the access token.
// don't just see it as "helping the FE" either, keep in mind the FE isn't the only consumer of our API. Our '/refresh' API could be called by a Web FE, but also a Mobile App, a Desktop App, or another Backend Service




export{
    login,
    refresh
}