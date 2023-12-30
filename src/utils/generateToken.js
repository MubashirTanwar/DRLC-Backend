export const generateTokens = async(Schema, ID) => {
    try {
        const logStudent = await Schema.findById(ID)

        const accessToken = logStudent.createAccessToken()

        const refreshToken = logStudent.createRefreshToken();

        logStudent.refreshToken = refreshToken
        await logStudent.save({validateBeforeSave: false})

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}