import * as userService from "./user.service.js";



 
const getAllUsers = async (req, res) =>
{
    const allUsers = await userService.getAllUsers();

    res.status(200).json(allUsers);
};



const lookupUserById = async (req, res) =>
{
    const userId = req.params.userId;

    const foundUser = await userService.getUserById(userId);

    res.status(200).json(foundUser);
};
// 'lookupUserById' is meant to encompass both 'getUser' and 'findUser' since we can only choose one of the two controllers to be reached by a "GET users/:userId" route. "GET /users/:userId" is an endpoint where a nonexistent user should produce '404', so we need to use 'getUserById' since it can throw.


const createUser = async (req, res) =>
{
    const user = req.body;

    const newUser = await userService.createUser(user);

    res.status(201).json(newUser);
};



const updateProfile = async (req, res) =>
{
    const userId = req.user.userId;
    const updates = req.body;

    const updatedPf = await userService.updateProfile(userId, updates);

    res.status(200).json(updatedPf);
};




const changePassword = async (req, res) =>
{
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    await userService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({ message: "Password changed." });
};



const deleteUser = async (req, res) =>
{
    const userId = req.user.userId;

    await userService.deleteUser(userId);

    res.status(200).json({ message: "User deleted." });
};




export {
    getAllUsers,
    lookupUserById,
    createUser,
    updateProfile,
    changePassword,
    deleteUser
};