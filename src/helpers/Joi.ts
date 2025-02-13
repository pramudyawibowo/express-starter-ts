import type Joi from "joi";
import type { Request } from "express";

interface ErrorMessages {
    [key: string]: string[];
}

const translationMap: { [key: string]: string } = {
    // General Errors
    "is required": "wajib diisi",
    "is not allowed to be empty": "tidak boleh kosong",
    "must be a number": "harus berupa angka",
    "must be a string": "harus berupa string",
    "must be a boolean": "harus berupa boolean",
    "must be a date": "harus berupa tanggal",
    "must be an array": "harus berupa array",
    "must be an object": "harus berupa objek",
    "must be a valid email": "harus berupa email yang valid",
    "must be a valid url": "harus berupa URL yang valid",
    "must be a valid GUID": "harus berupa GUID yang valid",
    "must be a valid IP address": "harus berupa alamat IP yang valid",
    "must be a valid IPv4 address": "harus berupa alamat IPv4 yang valid",
    "must be a valid IPv6 address": "harus berupa alamat IPv6 yang valid",
    "must be a valid credit card": "harus berupa nomor kartu kredit yang valid",
    "must be a valid password": "harus berupa kata sandi yang valid",
    "must be one of": "harus salah satu dari",

    // String Specific
    "string.base": "harus berupa string",
    "string.email": "harus berupa email yang valid",
    "string.uri": "harus berupa URL yang valid",
    "string.regex.base": "format tidak sesuai",
    "string.min": "panjang minimal adalah {#limit}",
    "string.max": "panjang maksimal adalah {#limit}",

    // Number Specific
    "number.base": "harus berupa angka",
    "number.min": "nilai minimal adalah {#limit}",
    "number.max": "nilai maksimal adalah {#limit}",
    "number.integer": "harus berupa angka bulat",
    "number.positive": "harus berupa angka positif",
    "number.negative": "harus berupa angka negatif",

    // Boolean Specific
    "boolean.base": "harus berupa boolean (true/false)",

    // Date Specific
    "date.base": "harus berupa tanggal",
    "date.min": "tanggal tidak boleh lebih awal dari {#limit}",
    "date.max": "tanggal tidak boleh lebih dari {#limit}",

    // Array Specific
    "array.base": "harus berupa array",
    "array.min": "array harus memiliki minimal {#limit} elemen",
    "array.max": "array hanya boleh memiliki maksimal {#limit} elemen",

    // Object Specific
    "object.base": "harus berupa objek",
    "object.unknown": "tidak boleh memiliki properti tambahan",

    // Custom Error Messages
    "any.invalid": "nilai tidak valid",
    "any.only": "nilai harus salah satu dari {#valids}",
    "any.required": "wajib diisi",
    "any.empty": "tidak boleh kosong",
    "any.ref": "referensi tidak valid",

    // Number Validation
    "number.unsafe": "nilai tidak aman atau terlalu besar",

    // Miscellaneous Errors
    "array.unique": "array tidak boleh memiliki elemen duplikat",
    "date.format": "format tanggal tidak sesuai",
};

const translateErrorMessage = (message: string): string => {
    let translatedMessage = message;
    // Loop through the translation map and replace the error message
    Object.keys(translationMap).forEach((key) => {
        if (translatedMessage.includes(key)) {
            translatedMessage = translatedMessage.replace(key, translationMap[key]);
        }
    });
    return translatedMessage;
};

export const joiValidate = async (schema: Joi.ObjectSchema, data: Request) => {
    try {
        if (data.files && data.files.length != 0) {
            (data.files as Express.Multer.File[]).forEach((field: Express.Multer.File) => {
                if (field.fieldname.includes("[]")) {
                    const arrayFieldName = field.fieldname.replace("[]", "");
                    if (!data.body[arrayFieldName]) {
                        data.body[arrayFieldName] = [];
                    }
                    data.body[arrayFieldName].push(field);
                } else {
                    data.body[field.fieldname] = field;
                }
            });
        }
        await schema.validateAsync(data.body, { abortEarly: false, allowUnknown: true });
        return;
    } catch (error) {
        const errorMessages: ErrorMessages = (error as Joi.ValidationError).details.reduce((acc: ErrorMessages, detail: Joi.ValidationErrorItem) => {
            if (detail.context && detail.context.key) {
                const fieldName = detail.context.key;
                if (!acc[fieldName]) {
                    acc[fieldName] = [];
                }
                // Translate the error message before pushing it to the result
                const translatedMessage = translateErrorMessage(detail.message.replace(/"/g, ""));
                acc[fieldName].push(translatedMessage);
            }
            return acc;
        }, {} as ErrorMessages);

        return errorMessages;
    }
};
