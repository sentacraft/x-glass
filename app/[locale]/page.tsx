import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-4 py-32">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('appName')}
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          {t('appDesc')}
        </p>
      </main>
    </div>
  );
}
