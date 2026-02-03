import type { Route } from "./+types/home";
import { searchProperties } from "../lib/rentcast";
import type { Property, PropertySearchParams, PropertySearchResult } from "../lib/property-types";
import { MOCK_PROPERTIES } from "../lib/mock-properties";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Find Your Home | Home Search" },
		{ name: "description", content: "Search homes for sale and rent with real-time data." },
	];
}

function filterMock(city?: string, state?: string, zipCode?: string) {
	let list = [...MOCK_PROPERTIES];
	if (city)
		list = list.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()));
	if (state)
		list = list.filter((p) => p.state.toUpperCase() === state.toUpperCase());
	if (zipCode) list = list.filter((p) => p.zipCode === zipCode);
	return list;
}

export async function loader({ request, context }: Route.LoaderArgs): Promise<PropertySearchResult & { search: { city: string; state: string; zipCode: string } }> {
	const url = new URL(request.url);
	const city = url.searchParams.get("city") ?? undefined;
	const state = url.searchParams.get("state") ?? undefined;
	const zipCode = url.searchParams.get("zipCode") ?? undefined;
	const limit = Math.min(Number(url.searchParams.get("limit")) || 24, 50);
	const offset = Number(url.searchParams.get("offset")) || 0;
	const apiKey = context.cloudflare.env.RENTCAST_API_KEY;

	const params: PropertySearchParams = { city, state, zipCode, limit, offset };

	if (apiKey && (city || state || zipCode)) {
		try {
			const { properties, total } = await searchProperties(params, apiKey);
			return {
				properties,
				total,
				usingMockData: false,
				search: { city: city ?? "", state: state ?? "", zipCode: zipCode ?? "" },
			};
		} catch (_err) {
			// Fall through to mock data on API error
		}
	}

	const filtered = filterMock(city, state, zipCode);
	const total = filtered.length;
	const properties = filtered.slice(offset, offset + limit);
	return {
		properties,
		total,
		usingMockData: true,
		search: { city: city ?? "", state: state ?? "", zipCode: zipCode ?? "" },
	};
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<nav className="border-b border-[var(--border)] bg-[var(--card-bg)]">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
					<span className="font-heading text-xl font-semibold text-[var(--text-primary)]">HomeSearch</span>
				</div>
			</nav>
			<HomeSearchHeader />
			<SearchForm defaultCity={loaderData.search.city} defaultState={loaderData.search.state} defaultZipCode={loaderData.search.zipCode} />
			<PropertyResults
				properties={loaderData.properties}
				total={loaderData.total}
				usingMockData={loaderData.usingMockData}
			/>
		</>
	);
}

function HomeSearchHeader() {
	return (
		<header className="relative overflow-hidden bg-[var(--hero-bg)] border-b border-[var(--border)]">
			<div className="absolute inset-0 bg-[var(--hero-pattern)] opacity-[0.03]" />
			<div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
				<h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--text-primary)] tracking-tight">
					Find your next home
				</h1>
				<p className="mt-3 text-lg text-[var(--text-muted)] max-w-xl">
					Search by city, state, or zip. Real property data when you add a RentCast API key.
				</p>
			</div>
		</header>
	);
}

function SearchForm({
	defaultCity = "",
	defaultState = "",
	defaultZipCode = "",
}: {
	defaultCity?: string;
	defaultState?: string;
	defaultZipCode?: string;
}) {
	return (
		<section className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--border)] shadow-sm">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
				<form method="get" className="flex flex-wrap items-end gap-3 sm:gap-4">
					<div className="flex-1 min-w-[140px]">
						<label htmlFor="city" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
							City
						</label>
						<input
							id="city"
							name="city"
							type="text"
							placeholder="e.g. San Francisco"
							className="input"
							defaultValue={defaultCity}
						/>
					</div>
					<div className="w-24 min-w-[70px]">
						<label htmlFor="state" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
							State
						</label>
						<input
							id="state"
							name="state"
							type="text"
							placeholder="CA"
							maxLength={2}
							className="input uppercase"
							defaultValue={defaultState}
						/>
					</div>
					<div className="w-28 min-w-[80px]">
						<label htmlFor="zipCode" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
							ZIP
						</label>
						<input
							id="zipCode"
							name="zipCode"
							type="text"
							placeholder="94102"
							className="input"
							defaultValue={defaultZipCode}
						/>
					</div>
					<button type="submit" className="btn-primary">
						Search
					</button>
				</form>
			</div>
		</section>
	);
}

function PropertyResults({
	properties,
	total,
	usingMockData,
}: {
	properties: PropertySearchResult["properties"];
	total: number;
	usingMockData: boolean;
}) {
	return (
		<section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
			{usingMockData && (
				<div className="mb-6 p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-[var(--text-secondary)] text-sm">
					<strong>Demo mode.</strong> Showing sample listings. Add{" "}
					<code className="px-1.5 py-0.5 rounded bg-[var(--card-bg)]">RENTCAST_API_KEY</code> in
					Cloudflare for live data (50 free calls/month at{" "}
					<a
						href="https://rentcast.io"
						target="_blank"
						rel="noreferrer"
						className="underline text-[var(--accent)]"
					>
						rentcast.io
					</a>
					).
				</div>
			)}
			<p className="text-[var(--text-muted)] text-sm mb-6">
				{total} {total === 1 ? "property" : "properties"} found
			</p>
			{properties.length === 0 ? (
				<div className="text-center py-16 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]">
					<p className="text-[var(--text-muted)]">No properties match your search.</p>
					<p className="text-[var(--text-muted)] text-sm mt-1">
						Try a different city, state, or ZIP.
					</p>
				</div>
			) : (
				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{properties.map((p) => (
						<li key={p.id}>
							<PropertyCard property={p} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function PropertyCard({ property: p }: { property: Property }) {
	const addr = p.formattedAddress || [p.address, p.city, p.state, p.zipCode].filter(Boolean).join(", ");
	const priceStr =
		p.price != null
			? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
					p.price
				)
			: null;
	const rentStr =
		p.rentEstimate != null
			? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
					p.rentEstimate
				) + "/mo"
			: null;

	return (
		<article className="group h-full flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--accent-muted)] transition-all duration-200">
			<div className="aspect-[4/3] bg-[var(--muted)] relative overflow-hidden">
				{p.imageUrl ? (
					<img
						src={p.imageUrl}
						alt={addr}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-sm">
						No image
					</div>
				)}
			</div>
			<div className="p-4 sm:p-5 flex flex-col flex-1">
				{priceStr && (
					<p className="font-heading text-xl font-semibold text-[var(--text-primary)]">{priceStr}</p>
				)}
				{rentStr && (
					<p className="text-sm text-[var(--text-muted)] mt-0.5">Est. rent {rentStr}</p>
				)}
				<p className="mt-2 text-[var(--text-secondary)] font-medium line-clamp-2">{addr}</p>
				<div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
					{p.bedrooms != null && <span>{p.bedrooms} bed</span>}
					{p.bathrooms != null && <span>{p.bathrooms} bath</span>}
					{p.squareFootage != null && <span>{p.squareFootage.toLocaleString()} sq ft</span>}
					{p.propertyType && <span>{p.propertyType}</span>}
				</div>
			</div>
		</article>
	);
}
