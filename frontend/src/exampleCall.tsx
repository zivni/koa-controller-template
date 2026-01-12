import axios from "axios";
import { useState } from "react";
import { getArticleUrl } from "./network/apiUrls";

export const ExampleCall = () => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const getData = async () => {
        try {
            const response = await axios.get(getArticleUrl("123", new Date()));
            setError(null);
            setData(response.data.data);
        } catch (error) {
            setError("Error fetching data");
        }
    };
    console.log("ExampleCall render", data);

    return (
        <>
            <div>Example Call Component</div>
            <button onClick={getData}>get data</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <div>Data from API:</div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <div>The date is {data?.date.toString()}</div>
        </>
    );
}