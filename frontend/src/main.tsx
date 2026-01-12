import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './network/axiosDefaults';
import { ExampleCall } from './exampleCall';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

root.render(
    <StrictMode>
        <ExampleCall />
    </StrictMode>
);