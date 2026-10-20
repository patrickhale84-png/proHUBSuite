MemberProfiles - CSV import template

Import with Content Manager -> MemberProfiles -> Import -> Upload CSV.

The header row must match the collection's field keys exactly:
  title, memberId, profile, version, updatedAt

Before importing, replace the two placeholders in memberId with real Wix member _id values
(Members -> click a member -> the id is in the URL and in the member detail). A row whose
memberId matches no member imports fine but no one will ever see it.

Field notes
  profile    one JSON string, double-quoted by the CSV. Inner quotes are doubled by the writer.
             Do not pretty-print it - newlines inside a field are legal CSV but some importers
             mangle them, so keep it on one line.
  version    integer. Import as the stored version; the next save writes version+1.
  updatedAt  ISO 8601 (yyyy-mm-ddThh:mm:ss.sssZ). Wix parses this into a Date field.
  title      what a project picker will show.

What the two sample rows contain
  stellar_nursery  a full profile: a four-line screenplay plus screenplay:main, cast:updated,
                   locations:updated and scenes:list - i.e. what the hub publishes after an import.
  blank_project    an empty profile, version 0, to prove a fresh member record.

Anything binary (board PNGs, reference images, exported PDFs) does not belong in this column.
The collection item limit is about 1 MB; store those in the Media Manager and keep the URL here.
