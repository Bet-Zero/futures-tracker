import React, { useState } from "react";
import AddBetModal from "../components/AddBetModal";

const AddBetPage = () => {
  const [open, setOpen] = useState(true);
  return open ? <AddBetModal onClose={() => setOpen(false)} /> : null;
};

export default AddBetPage;
