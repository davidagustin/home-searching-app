export interface Property {
	id: string;
	address: string;
	city: string;
	state: string;
	zipCode: string;
	price?: number;
	rentEstimate?: number;
	bedrooms?: number;
	bathrooms?: number;
	squareFootage?: number;
	propertyType?: string;
	latitude?: number;
	longitude?: number;
	formattedAddress?: string;
	yearBuilt?: number;
}

export interface PropertySearchParams {
	city?: string;
	state?: string;
	zipCode?: string;
	limit?: number;
	offset?: number;
	propertyType?: string;
	minPrice?: number;
	maxPrice?: number;
	minBeds?: number;
	minBaths?: number;
}

export interface PropertySearchResult {
	properties: Property[];
	total: number;
	usingMockData: boolean;
}
