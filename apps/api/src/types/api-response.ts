export type ApiResponse<T> =
    | {
        success: true;
        statusCode: number;
        data: T;
        message: string;
    }
    | {
        success: false;
        statusCode: number;
        data: null;
        message: string;
    };

export function successResponse<T>(
    data: T,
    message: string,
    statusCode = 200,
): ApiResponse<T> {
    return { success: true, statusCode, data, message };
}

export function failureResponse(
    message: string,
    statusCode = 500,
): ApiResponse<never> {
    return { success: false, statusCode, data: null, message };
}
