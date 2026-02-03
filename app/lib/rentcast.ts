import type { Property, PropertySearchParams } from "./property-types";

const RENTCAST_BASE = "https://api.rentcast.io/v1";

function mapRentCastRecord(record: Record<string, unknown>, index: number): Property {
	const addr =
		(record.formattedAddress as string) ||
		[record.addressLine1, record.city, record.state, record.zipCode]
			.filter(Boolean)
			.join(", ");
	return {
		id: (record.id as string) || `rc-${index}`,
		address: (record.addressLine1 as string) || (record.address as string) || "",
		city: (record.city as string) || "",
		state: (record.state as string) || "",
		zipCode: String(record.zipCode ?? ""),
		price: typeof record.price === "number" ? record.price : undefined,
		rentEstimate:
			typeof record.rentEstimate === "number"
				? record.rentEstimate
				: typeof (record as Record<string, unknown>).rentEstimates?.amount === "number"
					? (record as Record<string, unknown>).rentEstimates.amount as number
					: undefined,
		bedrooms: typeof record.bedrooms === "number" ? record.bedrooms : undefined,
		bathrooms: typeof record.bathrooms === "number" ? record.bathrooms : undefined,
		squareFootage:
			typeof record.squareFootage === "number" ? record.squareFootage : undefined,
		propertyType: record.propertyType as string | undefined,
		latitude: typeof record.latitude === "number" ? record.latitude : undefined,
		longitude: typeof record.longitude === "number" ? record.longitude : undefined,
		formattedAddress: addr || undefined,
		yearBuilt: typeof record.yearBuilt === "number" ? record.yearBuilt : undefined,
	};
}

export async function searchProperties(
	params: PropertySearchParams,
	apiKey: string
): Promise<{ properties: Property[]; total: number }> {
	const searchParams = new URLSearchParams();
	if (params.city) searchParams.set("city", params.city);
	if (params.state) searchParams.set("state", params.state);
	if (params.zipCode) searchParams.set("zipCode", params.zipCode);
	searchParams.set("limit", String(Math.min(params.limit ?? 24, 50)));
	if (params.offset) searchParams.set("offset", String(params.offset));
	if (params.propertyType) searchParams.set("propertyType", params.propertyType);

	const url = `${RENTCAST_BASE}/properties?${searchParams.toString()}`;
	const res = await fetch(url, {
		headers: {
			Accept: "application/json",
			"X-Api-Key": apiKey,
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`RentCast API error ${res.status}: ${text}`);
	}

	const data = (await res.json()) as { properties?: unknown[]; [key: string]: unknown };
	const rawList = Array.isArray(data.properties) ? data.properties : Array.isArray(data) ? data : [];
	const properties = rawList.map((r, i) => mapRentCastRecord(r as Record<string, unknown>, i));
	return {
		properties,
		total: properties.length,
	};
}
