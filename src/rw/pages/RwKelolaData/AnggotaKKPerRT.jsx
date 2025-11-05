import React from "react";
import { useParams } from "react-router-dom";
import AnggotaKK from "./AnggotaKK";

function AnggotaKKPerRT() {
  const { noKK } = useParams();

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow p-6 max-w-5xl mx-auto">
        <AnggotaKK no_kk={noKK} />
      </div>
    </div>
  );
}

export default AnggotaKKPerRT;
