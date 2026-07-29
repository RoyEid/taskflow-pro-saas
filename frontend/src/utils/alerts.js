import Swal from "sweetalert2";

// Configure alerts from the same semantic tokens as cards and dialogs.
const getSwalConfig = () => {
  return {
    background: "var(--tf-bg-elevated)",
    color: "var(--tf-fg)",
    customClass: {
      popup: "tf-card-elevated rounded-[var(--tf-r-xl)]",
      title: "tf-title-section mb-2",
      htmlContainer: "tf-body m-0 text-center",
      confirmButton: "tf-btn-base tf-btn-primary mx-1",
      cancelButton: "tf-btn-base tf-btn-secondary mx-1",
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
    iconColor: "var(--tf-success)",
    confirmButtonText: "OK",
  });
};

export const showError = (message, title = "Error") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: "error",
    iconColor: "var(--tf-error)",
    confirmButtonText: "Close",
  });
};

export const showWarning = (message, title = "Warning") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: "warning",
    iconColor: "var(--tf-warning)",
    confirmButtonText: "OK",
  });
};

export const confirmAction = ({ title, text, confirmButtonText = "Confirm" }) => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text,
    icon: "question",
    iconColor: "var(--tf-info)",
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
    iconColor: "var(--tf-error)",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      ...config.customClass,
      confirmButton: "tf-btn-base tf-btn-danger mx-1",
    },
  }).then((result) => result.isConfirmed);
};
