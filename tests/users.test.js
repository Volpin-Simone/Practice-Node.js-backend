import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";               // this is only used by the "test admin success" test
import jwt from "jsonwebtoken";









beforeAll(async () =>
{
    if(process.env.NODE_ENV !== "test")
    {
        throw new Error("Refusing to wipe the database: NODE_ENV is not 'test'");
    }

    await prisma.user.deleteMany();
});



afterAll(async () =>
{
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});








// beginning of 'users'/'auth' tests 

describe("Users API", () =>
{

        // 1.  
        it("should create a user", async () =>
        {
            const response = await request(app)
                .post("/users")
                .send({
                    name: "Test User",
                    email: `test-${Date.now()}@example.com`,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("userId");
            expect(response.body.name).toBe("Test User");
        });





        // 2.  
        it("should reject an invalid user", async () =>
        {
            const response = await request(app)
                .post("/users")
                .send({
                    name: "",
                    email: "not-an-email",
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            console.log(response.body);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message");
            expect(response.body).toHaveProperty("details");
        });





        // 3.  
        it("should reject duplicate email", async () =>
        {
            const email = `duplicate-${Date.now()}@example.com`;

            const user = {
                name: "Test User",
                email,
                password: "TestPassword123!",
                pet: "Dog"
            };

            const firstResponse = await request(app)
                .post("/users")
                .send(user);

            expect(firstResponse.status).toBe(201);

            const secondResponse = await request(app)
                .post("/users")
                .send(user);

            expect(secondResponse.status).toBe(409);
            expect(secondResponse.body).toHaveProperty("message");
        });





        // 4.  
        it("should get all users", async () =>
        {
            const email = `get-all-${Date.now()}@example.com`;

            const user = {
                name: "Test User",
                email,
                password: "TestPassword123!",
                pet: "Dog"
            };

            await request(app)
                .post("/users")
                .send(user);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: user.password
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        // this is a test for "GET /users", but since the route requires authentication we need a valid access token, so the test needs to create a user, log in with that user, then use the returned token




        // 5.  authentication failure: wrong password
        it("should reject an incorrect password", async () =>
        {
            const email = `wrong-password-${Date.now()}@example.com`;

            await request(app)
                .post("/users")
                .send({
                    name: "Test User",
                    email,
                    password: "CorrectPassword123!",
                    pet: "Dog"
                });

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "WrongPassword123!"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Incorrect email or password");
        });



        // 6.  login with a nonexistent email
        it("should reject a nonexistent email", async () =>
        {
            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: `does-not-exist-${Date.now()}@example.com`,
                    password: "SomePassword123!"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Incorrect email or password");
        });




        // 7.  protected route without authentication
        it("should reject unauthenticated access to users", async () =>
        {
            const response = await request(app)
                .get("/users");

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("message");
        });



        // 8.  get all
        it("should allow authenticated access to users", async () =>
        {
            const email = `authenticated-${Date.now()}@example.com`;

            await request(app)
                .post("/users")
                .send({
                    name: "Test User",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });




        // 9.  authorization
        it("should reject a normal user accessing an admin-only route", async () =>
        {
            const email = `user-role-${Date.now()}@example.com`;

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Test User",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const userId = createResponse.body.userId;

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get(`/users/${userId}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty("message");
        });





        // 10.  admin success path: this creates a user, promote that user to ADMIN, log in, then verify that the admin can access GET /users/:userId
        it("should allow an admin to access a user by id", async () =>
        {
            const email = `admin-${Date.now()}@example.com`;

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Admin User",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const userId = createResponse.body.userId;

            await prisma.user.update({
                where: { userId },
                data: { role: "ADMIN" }
            });

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get(`/users/${userId}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.userId).toBe(userId);
        });




        // 11.  admin endpoint's 'not-found' case
        it("should return 404 when an admin requests a nonexistent user", async () =>
        {
            const email = `admin-not-found-${Date.now()}@example.com`;

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Admin User",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const userId = createResponse.body.userId;

            await prisma.user.update({
                where: { userId },
                data: { role: "ADMIN" }
            });

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get("/users/999999999")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message");
        });




        // 12.  verifies that your validateParams(userIdSchema) middleware is actually rejecting malformed IDs before the controller reaches Prisma
        it("should reject an invalid user ID", async () =>
        {
            const email = `admin-invalid-id-${Date.now()}@example.com`;

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Admin User",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const userId = createResponse.body.userId;

            await prisma.user.update({
                where: { userId },
                data: { role: "ADMIN" }
            });

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .get("/users/not-a-number")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message");
            expect(response.body).toHaveProperty("details");
        });





        // 13.  update your own profile successfully: this tests the authenticated PUT /users/me path, including the body validation and controller/service flow
        it("should update the authenticated user's profile", async () =>
        {
            const email = `update-profile-${Date.now()}@example.com`;

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Original Name",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .put("/users/me")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    name: "Updated Name",
                    pet: "Cat"
                });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe("Updated Name");
            expect(response.body.pet).toBe("Cat");
            expect(response.body.email).toBe(email);
        });






        // 14.  validation of profile updates: send an invalid name and make sure the request gets rejected before reaching the service
        it("should reject an invalid profile update", async () =>
        {
            const email = `invalid-update-${Date.now()}@example.com`;

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Original Name",
                    email,
                    password: "TestPassword123!",
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .put("/users/me")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    name: "",
                    pet: "Cat"
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message");
            expect(response.body).toHaveProperty("details");
        });




        // 15.  change password successfully, and confirm the new password is what's actually accepted on the next login; this tests the PATCH /users/me/password flow, including authentication, validation, bcrypt hashing, and persistence
        it("should change the authenticated user's password and allow login with the new one", async () =>
        {
            const email = `change-password-${Date.now()}@example.com`;
            const oldPassword = "OldPassword123!";
            const newPassword = "NewPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Password User",
                    email,
                    password: oldPassword,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: oldPassword
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const changePasswordResponse = await request(app)
                .patch("/users/me/password")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    currentPassword: oldPassword,
                    newPassword
                });

            expect(changePasswordResponse.status).toBe(200);
            expect(changePasswordResponse.body).toHaveProperty("message");

            const secondLoginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: newPassword
                });

            expect(secondLoginResponse.status).toBe(200);
            expect(secondLoginResponse.body).toHaveProperty("accessToken");
            expect(secondLoginResponse.body).toHaveProperty("refreshToken");
        });





        // 16.  old password should no longer work after changing it
        it("should reject the old password after changing it", async () =>
        {
            const email = `old-password-${Date.now()}@example.com`;
            const oldPassword = "OldPassword123!";
            const newPassword = "NewPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Old Password User",
                    email,
                    password: oldPassword,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: oldPassword
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const changePasswordResponse = await request(app)
                .patch("/users/me/password")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    currentPassword: oldPassword,
                    newPassword
                });

            expect(changePasswordResponse.status).toBe(200);

            const oldPasswordLoginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password: oldPassword
                });

            expect(oldPasswordLoginResponse.status).toBe(401);
        });








        // 17.  'change password' inputting wrong current password should fail with 401.
        it("should reject a password change with an incorrect current password", async () =>
        {
            const email = `wrong-current-password-${Date.now()}@example.com`;
            const password = "CorrectPassword123!";
            const wrongPassword = "WrongPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Password User",
                    email,
                    password,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const response = await request(app)
                .patch("/users/me/password")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    currentPassword: wrongPassword,
                    newPassword: "NewPassword123!"
                });

            expect(response.status).toBe(401);
        });






        // 18.  change password without authentication should return 401; this verifies that '/users/me/password' cannot be used without a valid access token
        it("should reject an unauthenticated password change", async () =>
        {
            const response = await request(app)
                .patch("/users/me/password")
                .send({
                    currentPassword: "OldPassword123!",
                    newPassword: "NewPassword123!"
                });

            expect(response.status).toBe(401);
        });






        // 19.  delete your own account successfully
        it("should delete the authenticated user's account", async () =>
        {
            const email = `delete-user-${Date.now()}@example.com`;
            const password = "DeletePassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Delete User",
                    email,
                    password,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const deleteResponse = await request(app)
                .delete("/users/me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(deleteResponse.status).toBe(200);
        });






        // 20.  an unauthenticated user should not be able to delete an account
        it("should reject an unauthenticated account deletion", async () =>
        {
            const response = await request(app)
                .delete("/users/me");

            expect(response.status).toBe(401);
        });





        // 21.  verify that deleting the account actually removes the user, rather than merely returning 200: create a user, delete them, then try to log in
        it("should not allow login after account deletion", async () =>
        {
            const email = `deleted-user-${Date.now()}@example.com`;
            const password = "DeletePassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Deleted User",
                    email,
                    password,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;

            const deleteResponse = await request(app)
                .delete("/users/me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(deleteResponse.status).toBe(200);

            const loginAfterDeletionResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginAfterDeletionResponse.status).toBe(401);
        });
        // could the delete test and this test just be merged, perhaps?






        // 22.  refresh-token flow ('/auth/refresh')
        it("should refresh an access token", async () =>
        {
            const email = `refresh-${Date.now()}@example.com`;
            const password = "RefreshPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Refresh User",
                    email,
                    password,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty("refreshToken");

            const refreshResponse = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken: loginResponse.body.refreshToken
                });

            expect(refreshResponse.status).toBe(200);
            expect(refreshResponse.body).toHaveProperty("accessToken");
        });






        // 23.  invalid refresh token should be rejected
        it("should reject an invalid refresh token", async () =>
        {
            const response = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken: "this-is-not-a-valid-refresh-token"
                });

            expect(response.status).toBe(401);
        });






        // 24.  refreshing with a valid JWT but a token that isn't stored in a session should fail
        it("should reject a refresh token that is not stored in a session", async () =>
        {
            const email = `unknown-refresh-${Date.now()}@example.com`;
            const password = "RefreshPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Refresh User",
                    email,
                    password,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginResponse.status).toBe(200);

            const validRefreshToken = loginResponse.body.refreshToken;

            const decoded = jwt.decode(validRefreshToken);

            const fakeRefreshToken = jwt.sign(
                {
                    userId: decoded.userId,
                    fake: true                         // we need this to differentiate the real and fake refresh token because, since they both get generated within the
                },                                     // the same second, they are functionally identical down to their "issued at". Adding this additional claim fixes that
                process.env.REFRESH_TOKEN_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            const refreshResponse = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken: fakeRefreshToken
                });

            expect(refreshResponse.status).toBe(401);
        });







        // 25.  refreshing after the user account has been deleted should fail
        it("should reject a refresh token after the user is deleted", async () =>
        {
            const email = `deleted-refresh-${Date.now()}@example.com`;
            const password = "RefreshPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({
                    name: "Deleted Refresh User",
                    email,
                    password,
                    pet: "Dog"
                });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email,
                    password
                });

            expect(loginResponse.status).toBe(200);

            const accessToken = loginResponse.body.accessToken;
            const refreshToken = loginResponse.body.refreshToken;

            const deleteResponse = await request(app)
                .delete("/users/me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(deleteResponse.status).toBe(200);

            const refreshResponse = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken
                });

            expect(refreshResponse.status).toBe(401);
        });







        // 26.  refresh token with a valid JWT but a nonexistent user ID is rejected
        it("should reject a refresh token for a nonexistent user", async () =>
        {
            const fakeRefreshToken = jwt.sign(
                {
                    userId: 999999999
                },
                process.env.REFRESH_TOKEN_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            const response = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken: fakeRefreshToken
                });

            expect(response.status).toBe(401);
        });







        // 27.  validation on the refresh endpoint: a request with no refreshToken at all should return 400, rather than reaching the service
        it("should reject a refresh request without a refresh token", async () =>
        {
            const response = await request(app)
                .post("/auth/refresh")
                .send({});

            expect(response.status).toBe(400);
        });





        // 28. refresh validation: a refresh request with the wrong data type
        it("should reject a refresh token that is not a string", async () =>
        {
            const response = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken: 12345
                });

            expect(response.status).toBe(400);
        });






        // 29.  login validation: a login request with a missing password should return 400 rather than reaching bcrypt/authentication logic
        it("should reject a login request without a password", async () =>
        {
            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "test@example.com"
                });

            expect(response.status).toBe(400);
        });






        // 30.  login validation: same as previous but with email
        it("should reject a login request without an email", async () =>
        {
            const response = await request(app)
                .post("/auth/login")
                .send({
                    password: "SomePassword123!"
                });

            expect(response.status).toBe(400);
        });






        // 31.  registration validation for a missing password
        it("should reject user creation without a password", async () =>
        {
            const response = await request(app)
                .post("/users")
                .send({
                    name: "Test User",
                    email: `missing-password-${Date.now()}@example.com`,
                    pet: "Dog"
                });

            expect(response.status).toBe(400);
        });









        // 32.  same as previous ut with missing email
        it("should reject user creation without an email", async () =>
        {
            const response = await request(app)
                .post("/users")
                .send({
                    name: "Test User",
                    password: "Password123!",
                    pet: "Dog"
                });

            expect(response.status).toBe(400);
        });







        // 33.  unauthenticated request to the admin user lookup route: this verifies a user with no token at all gets 401
        it("should reject unauthenticated access to a user by id", async () =>
        {
            const response = await request(app)
                .get("/users/1");

            expect(response.status).toBe(401);
        });









        // 34.  unauthenticated profile update: this confirms /users/me cannot be used without an access token
        it("should reject unauthenticated profile updates", async () =>
        {
            const response = await request(app)
                .put("/users/me")
                .send({
                    name: "Updated Name",
                    pet: "Cat"
                });

            expect(response.status).toBe(401);
        });







        // 35.  invalid authentication: a malformed Bearer token should return 401
        it("should reject an invalid access token", async () =>
        {
            const response = await request(app)
                .get("/users")
                .set("Authorization", "Bearer this-is-not-a-valid-token");

            expect(response.status).toBe(401);
        });







        // 36.  wrong authentication scheme: this makes sure my middleware isn't merely looking for *any* Authorization header
        it("should reject an access token without the Bearer scheme", async () =>
        {
            const response = await request(app)
                .get("/users")
                .set("Authorization", "Token some-invalid-token");

            expect(response.status).toBe(401);
        });








        // 37.  expired access token
        it("should reject an expired access token", async () =>
        {
            const expiredToken = jwt.sign(
                {
                    userId: 1,
                    role: "USER"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "-1s"
                }
            );

            const response = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
        });






        // 38.  expired refresh JWT
        it("should reject an expired refresh token", async () =>
        {
            const expiredRefreshToken = jwt.sign(
                {
                    userId: 1
                },
                process.env.REFRESH_TOKEN_SECRET,
                {
                    expiresIn: "-1s"
                }
            );

            const response = await request(app)
                .post("/auth/refresh")
                .send({
                    refreshToken: expiredRefreshToken
                });

            expect(response.status).toBe(401);
        });







        // 40.  session expired in the database, even though the refresh JWT itself hasn't expired yet
        it("should reject a refresh token whose session has expired, independent of the JWT's own expiry", async () =>
        {
            const email = `expired-session-${Date.now()}@example.com`;
            const password = "SessionPassword123!";

            const createResponse = await request(app)
                .post("/users")
                .send({ name: "Session User", email, password, pet: "Dog" });

            expect(createResponse.status).toBe(201);

            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ email, password });

            expect(loginResponse.status).toBe(200);

            const { refreshToken } = loginResponse.body;
            const userId = createResponse.body.userId;

            // the JWT is still perfectly valid; we're only aging the session row itself
            await prisma.session.updateMany({
                where: { userId },
                data: { expiresAt: new Date(Date.now() - 1000) }
            });

            const refreshResponse = await request(app)
                .post("/auth/refresh")
                .send({ refreshToken });

            expect(refreshResponse.status).toBe(401);
        });

});

