import Hashids from 'hashids';
// Ganti 'my-secret-salt' dengan string acak yang kuat
const hashids = new Hashids('aspec-monitoring-secure-salt', 8);

export const encodeId = (id: number) => hashids.encode(id);
export const decodeId = (hash: string) => {
    const decoded = hashids.decode(hash);
    return decoded.length > 0 ? Number(decoded[0]) : null;
};