import axios from "axios";

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
const dateParser = (key: string, value: any) => {
    if (typeof value === 'string' && ISO_8601.test(value)) {
        var newValue;
        if (!value.endsWith("Z")) {
            newValue = `${value}Z`;
            console.error("WARNING date without Z ending", value)
        }
        else newValue = value
        return new Date(newValue);
    }
    return value;
}
const transformDates = function transformResponse(data: any) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data, dateParser);
        } catch (e) {
            return data;
        }
    }
    return data;
}

axios.defaults.transformResponse = [transformDates];
