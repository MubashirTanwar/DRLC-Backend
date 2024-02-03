export const generateTokens = async (Schema, ID) => {
    try {
        const user = await Schema.findById(ID);

        const accessToken = user.createAccessToken();

        const refreshToken = user.createRefreshToken();
        user.refreshToken = refreshToken;
        const final = await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

export const generateRefreshTokens = async (Schema, ID) => {
    try {
        const user = await Schema.findById(ID);
        const accessToken = user.createAccessToken();
        const final = await user.save({ validateBeforeSave: false });
        return { accessToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};
