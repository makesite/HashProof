import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { keccak256, toBytes } from "viem";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "prove", type: "function", stateMutability: "nonpayable", inputs: [{ name: "hash", type: "bytes32" }, { name: "label", type: "string" }], outputs: [] },
  { name: "verify", type: "function", stateMutability: "view", inputs: [{ name: "hash", type: "bytes32" }], outputs: [{ name: "exists", type: "bool" }, { name: "prover", type: "address" }, { name: "timestamp", type: "uint256" }, { name: "blockNumber", type: "uint256" }, { name: "label", type: "string" }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

const AC = "#6366f1";

export default function App() {
  const { isConnected } = useAccount();
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [verifyText, setVerifyText] = useState("");
  const [done, setDone] = useState(false);

  const computedHash = text ? keccak256(toBytes(text)) : null;
  const verifyHash = verifyText ? keccak256(toBytes(verifyText)) : null;

  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "total", query: { refetchInterval: 10000 } });
  const { data: verifyResult } = useReadContract({ address: ADDR, abi: ABI, functionName: "verify", args: [verifyHash!], query: { enabled: !!verifyHash } });

  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (isSuccess && !done) { setDone(true); setTimeout(() => setDone(false), 3000); }
  const isLoading = isPending || isConfirming;

  const vr = verifyResult as any;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: `${AC}15` }} />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <span className="font-bold text-white text-lg">Hash<span style={{ color: AC }}>Proof</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-3xl font-black text-white mb-2">On-chain <span style={{ color: AC }}>Hash Proof</span></h1>
          <p className="text-slate-400 text-sm">Prove document existence by storing its hash on Arc. Immutable, timestamped, verifiable.</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-slate-400 text-sm">{total ? Number(total) : 0} proofs registered</span>
          </div>
        </div>
        <div className="space-y-4">
          {!isConnected ? (
            <div className="text-center py-8 text-slate-500">Connect wallet to register a proof</div>
          ) : (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4">🔐 Register Proof</h2>
              <div className="space-y-3 mb-4">
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste your document text or data to hash..." rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 resize-none" />
                {computedHash && <p className="text-xs text-slate-400 font-mono break-all bg-slate-800/40 px-3 py-2 rounded-lg">Hash: {computedHash}</p>}
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Contract v1.0, Report 2025)" className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60" />
              </div>
              {done ? (
                <div className="py-3 text-center rounded-xl font-bold text-sm" style={{ background: `${AC}20`, color: AC }}>🔐 Proof registered!</div>
              ) : (
                <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "prove", args: [computedHash!, label] })}
                  disabled={isLoading || !computedHash || !label}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ background: AC }}>
                  {isLoading ? (isPending ? "Confirm..." : "Registering...") : "🔐 Register Proof"}
                </button>
              )}
              {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.includes("Already proved") ? "Already registered!" : error.message?.slice(0, 80)}</p>}
            </div>
          )}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h2 className="font-bold text-white mb-3">🔍 Verify Proof</h2>
            <textarea value={verifyText} onChange={e => setVerifyText(e.target.value)} placeholder="Paste content to verify..." rows={3}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 resize-none mb-3" />
            {vr && verifyText && (
              <div className="rounded-xl p-4 border" style={{ background: vr[0] ? `${AC}10` : "rgba(239,68,68,0.1)", borderColor: vr[0] ? `${AC}40` : "rgba(239,68,68,0.3)" }}>
                {vr[0] ? (
                  <>
                    <p className="text-emerald-400 font-bold text-sm mb-2">✅ Proof exists on-chain</p>
                    <p className="text-slate-300 text-xs">Label: {vr[4]}</p>
                    <p className="text-slate-400 text-xs font-mono mt-1">Prover: {vr[1]?.slice(0,10)}...</p>
                    <p className="text-slate-400 text-xs">Block: #{vr[3]?.toString()}</p>
                  </>
                ) : <p className="text-red-400 text-sm font-bold">❌ Not found on-chain</p>}
              </div>
            )}
          </div>
        </div>
        <footer className="mt-10 text-center text-xs text-slate-600">
          <p>HashProof · <a href={`https://testnet.arcscan.app/address/${ADDR}`} target="_blank" rel="noreferrer" className="hover:text-slate-400">{ADDR.slice(0,6)}...{ADDR.slice(-4)}</a> · Chain {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}