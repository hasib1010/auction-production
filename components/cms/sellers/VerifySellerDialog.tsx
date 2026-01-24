import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

interface SellerDocument {
  id: string;
  type: string;
  url: string;
  status: string;
  createdAt: string;
  providedByAdmin?: boolean;
}

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
  bankSortCode: string;
  sellerStatus: string;
  infoDocuments: SellerDocument[];
}

interface VerifySellerDialogProps {
  seller: Seller | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function VerifySellerDialog({
  seller,
  onClose,
  onUpdate,
}: VerifySellerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    companyName: seller?.companyName || "",
    taxId: seller?.taxId || "",
    bankName: seller?.bankName || "",
    bankAccount: seller?.bankAccount || "",
    bankSortCode: seller?.bankSortCode || "",
    phone: seller?.phone || "",
  });
  //checking seller exist or not
  if (!seller) {
    return null;
  }

  const handleStatusUpdate = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/sellers/${seller.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Seller ${status} successfully`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/sellers/${seller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error("Failed to update details");

      toast.success("Seller details updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update details");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(true);
    const toastId = toast.loading("Deleting document...");
    try {
      const res = await fetch(
        `/api/cms/sellers/${seller.id}/documents/${docId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("Failed to delete document");

      toast.success("Document deleted", { id: toastId });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!seller} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Seller: {seller.companyName}</DialogTitle>
          <DialogDescription>
            Review the documents and approve or reject the seller account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-900">Seller Information</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isEditing) handleUpdateDetails();
                else setIsEditing(true);
              }}
              disabled={loading}
            >
              {isEditing ? "Save Details" : "Edit Details"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Applicant Name
              </p>
              <p className="font-semibold">
                {seller.firstName} {seller.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="font-semibold break-all">{seller.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              ) : (
                <p className="font-semibold">{seller.phone || "N/A"}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge
                variant={
                  seller.sellerStatus === "Approved"
                    ? "default"
                    : seller.sellerStatus === "Rejected"
                      ? "destructive"
                      : "secondary"
                }
                className={
                  seller.sellerStatus === "Approved"
                    ? "bg-green-600"
                    : seller.sellerStatus === "Pending"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : ""
                }
              >
                {seller.sellerStatus}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold text-gray-900 mb-3">
              Company & Tax Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Company Name
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.companyName}
                    onChange={(e) =>
                      setEditData({ ...editData, companyName: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                ) : (
                  <p className="font-semibold">{seller.companyName || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  VAT / Tax ID
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.taxId}
                    onChange={(e) =>
                      setEditData({ ...editData, taxId: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                ) : (
                  <p className="font-semibold">{seller.taxId || "N/A"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold text-gray-900 mb-3">Bank Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Bank Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankName}
                    onChange={(e) =>
                      setEditData({ ...editData, bankName: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                ) : (
                  <p className="font-semibold">{seller.bankName || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Account Number / IBAN
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankAccount}
                    onChange={(e) =>
                      setEditData({ ...editData, bankAccount: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                ) : (
                  <p className="font-semibold">{seller.bankAccount || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Sort Code / Swift Code
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.bankSortCode}
                    onChange={(e) =>
                      setEditData({ ...editData, bankSortCode: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                ) : (
                  <p className="font-semibold">
                    {seller.bankSortCode || "N/A"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Submitted Documents</h4>
              <div className="flex items-center gap-2">
                <select
                  id="admin-doc-type"
                  className="text-xs border rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-purple-500"
                  defaultValue="Contract"
                >
                  <option value="Contract">Contract</option>
                  <option value="Identity">Identity (KYC)</option>
                  <option value="ProofOfAddress">Address (KYC)</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="file"
                  id="admin-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const type = (
                      document.getElementById(
                        "admin-doc-type",
                      ) as HTMLSelectElement
                    ).value;
                    const toastId = toast.loading(`Uploading ${type}...`);
                    setLoading(true);

                    try {
                      const { uploadToCloudinary } =
                        await import("@/lib/cloudinary");
                      const uploadRes = await uploadToCloudinary(file, {
                        folder: "seller-documents",
                      });

                      const res = await fetch(
                        `/api/cms/sellers/${seller.id}/documents`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type,
                            url: uploadRes.secure_url,
                            name: file.name,
                          }),
                        },
                      );

                      if (!res.ok) throw new Error("Failed to save document");

                      toast.success(`${type} uploaded successfully`, {
                        id: toastId,
                      });
                      onUpdate();
                    } catch (error) {
                      console.error(error);
                      toast.error("Upload failed", { id: toastId });
                    } finally {
                      setLoading(false);
                      // Reset input
                      e.target.value = "";
                    }
                  }}
                  disabled={loading}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg text/plain"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("admin-upload")?.click()
                  }
                  disabled={loading}
                >
                  + Upload
                </Button>
              </div>
            </div>
            {seller.infoDocuments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {seller.infoDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-sm">{doc.type}</div>
                      <Badge variant="outline" className="text-xs">
                        {doc.status}
                      </Badge>
                      {doc.providedByAdmin && (
                        <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                          Admin Upload
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Document
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                        onClick={() => handleDocumentDelete(doc.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleStatusUpdate("Rejected")}
            disabled={loading || seller.sellerStatus === "Rejected"}
          >
            Reject
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStatusUpdate("Approved")}
            disabled={loading || seller.sellerStatus === "Approved"}
          >
            Approve Seller
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
