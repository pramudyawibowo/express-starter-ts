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

export { formatPhonenumber };
