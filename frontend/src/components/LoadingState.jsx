function LoadingState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
      <p className="mt-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
        {message || "Loading..."}
      </p>
    </div>
  );
}

export default LoadingState;
