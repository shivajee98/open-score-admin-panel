import ClientPage from './ClientPage';

export function generateStaticParams() {
    return [{ id: 'dummy' }];
}

export default function Page() {
    return <ClientPage />;
}
