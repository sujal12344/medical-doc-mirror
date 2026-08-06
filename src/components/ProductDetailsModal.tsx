/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    product: any;
};

export default function ProductDetailsModal({
    open,
    onClose,
    product,
}: Props) {
    if (!open || !product) return null;

    const renderBoolean = (value: boolean) => (
        <span className={value ? "text-green-600" : "text-red-600"}>
            {value ? "Yes" : "No"}
        </span>
    );

    const formatLabel = (text: string) => {
        return text
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
    };

    const Info = ({
        label,
        value,
    }: {
        label: string;
        value: any;
    }) => (
        <div className="border rounded-xl p-4 bg-surface2">
            <p className="text-sm text-muted mb-1">{label}</p>
            <div className="font-medium break-words">
                {value || "-"}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
            <div className="bg-surface w-full max-w-6xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center border-b p-5">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {product.name}
                        </h2>

                        <p className="text-muted">
                            {product.manufacturer}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">

                    {/* General */}
                    <section>
                        <h3 className="text-xl font-semibold mb-4">
                            General Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Info label="Device Type" value={product.deviceType} />
                            <Info label="Device Class" value={product.deviceClass} />
                            <Info label="Status" value={product.status} />
                            <Info
                                label="Sterile"
                                value={renderBoolean(product.isSterile)}
                            />
                            <Info
                                label="Has Software"
                                value={renderBoolean(product.hasSoftware)}
                            />
                            <Info
                                label="Countries"
                                value={product.countries?.join(", ")}
                            />
                        </div>
                    </section>

                    {/* Description */}
                    <section>
                        <h3 className="text-xl font-semibold mb-4">
                            Description
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            <Info
                                label="Description"
                                value={product.description}
                            />

                            <Info
                                label="Intended Use"
                                value={product.intendedUse}
                            />

                            <Info
                                label="Patient Population"
                                value={product.patientPopulation}
                            />
                        </div>
                    </section>

                    {/* Medical Device */}
                    {product.medDevice && (
                        <section>
                            <h3 className="text-xl font-semibold mb-4">
                                Medical Device
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(product.medDevice).map(
                                    ([key, value]) => (
                                        <Info
                                            key={key}
                                            label={formatLabel(key)}
                                            value={
                                                typeof value === "boolean"
                                                    ? renderBoolean(value)
                                                    : String(value)
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {/* IVD Device */}
                    {product.IVDdevice && (
                        <section>
                            <h3 className="text-xl font-semibold mb-4">
                                IVD Device
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(product.IVDdevice).map(
                                    ([key, value]) => (
                                        <Info
                                            key={key}
                                            label={formatLabel(key)}
                                            value={
                                                typeof value === "boolean"
                                                    ? renderBoolean(value)
                                                    : String(value)
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {/* Predicate Device */}
                    <section>
                        <h3 className="text-xl font-semibold mb-4">
                            Predicate Device
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(product.predDevice || {}).map(
                                ([key, value]) => (
                                    <Info
                                        key={key}
                                        label={formatLabel(key)}
                                        value={
                                            typeof value === "boolean"
                                                ? renderBoolean(value)
                                                : String(value)
                                        }
                                    />
                                )
                            )}
                        </div>
                    </section>

                    {/* Class Lock */}
                    <section>
                        <h3 className="text-xl font-semibold mb-4">
                            Classification Lock
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(product.classLock || {}).map(
                                ([key, value]) => (
                                    <Info
                                        key={key}
                                        label={formatLabel(key)}
                                        value={
                                            typeof value === "boolean"
                                                ? renderBoolean(value)
                                                : typeof value === "object"
                                                    ? JSON.stringify(value)
                                                    : String(value)
                                        }
                                    />
                                )
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}