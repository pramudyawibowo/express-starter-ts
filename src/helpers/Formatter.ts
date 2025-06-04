const formatPhonenumber = (phonenumber: string): string => {
    if (phonenumber.startsWith("0")) {
        return phonenumber.replace("0", "62");
    }

    if (phonenumber.startsWith("8")) {
        return phonenumber.replace("8", "628");
    }

    if (phonenumber.startsWith("+")) {
        return phonenumber.replace("+", "");
    }

    return phonenumber;
};

const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

const utcToWIB = (date: Date): Date => {
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const wibOffset = 7 * 60; // WIB is UTC+7
    const wibDate = new Date(utcDate.getTime() + wibOffset * 60000);
    return wibDate;
};

export { formatPhonenumber, formatRupiah, utcToWIB };
