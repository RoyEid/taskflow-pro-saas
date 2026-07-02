import Swal from "sweetalert2";

// Configure default options to match the app's aesthetic
const getSwalConfig = () => {
  const isDark = document.documentElement.classList.contains("dark");
  
  return {
    background: isDark ? "#18181b" : "#ffffff", // zinc-900 / white
    color: isDark ? "#f4f4f5" : "#18181b", // zinc-100 / zinc-900
    customClass: {
      popup: "rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl",
      title: "text-lg font-bold text-zinc-900 dark:text-white mb-2",
      htmlContainer: "text-[14px] text-zinc-600 dark:text-zinc-400 m-0 text-center",
      confirmButton: "rounded-lg bg-zinc-900 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm mx-2",
      cancelButton: "rounded-lg bg-white border border-zinc-200 px-5 py-2.5 text-[14px] font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition mx-2",
      actions: "mt-6 flex justify-center gap-2",
      icon: "border-0 p-0 m-0 mb-4 mx-auto",
    },
    buttonsStyling: false,
    showClass: {
      popup: "animate__animated animate__fadeIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOut animate__faster",
    },
  };
};

export const showSuccess = (message, title = "Success") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: "success",
    iconColor: "#10b981", // emerald-500
    confirmButtonText: "OK",
  });
};

export const showError = (message, title = "Error") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: "error",
    iconColor: "#ef4444", // red-500
    confirmButtonText: "Close",
  });
};

export const showWarning = (message, title = "Warning") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: "warning",
    iconColor: "#f59e0b", // amber-500
    confirmButtonText: "OK",
  });
};

export const confirmAction = ({ title, text, confirmButtonText = "Confirm" }) => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text,
    icon: "question",
    iconColor: "#6366f1", // indigo-500
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true, // Cancel on left, Confirm on right
  }).then((result) => result.isConfirmed);
};

export const confirmDelete = ({ title = "Are you sure?", text, confirmButtonText = "Delete" }) => {
  const config = getSwalConfig();
  return Swal.fire({
    ...config,
    title,
    text,
    icon: "warning",
    iconColor: "#ef4444", // red-500
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      ...config.customClass,
      confirmButton: "rounded-lg bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-red-700 shadow-sm mx-2",
    },
  }).then((result) => result.isConfirmed);
};
