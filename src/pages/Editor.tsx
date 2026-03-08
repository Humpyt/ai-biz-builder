import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Sparkles, RefreshCw, Eye, EyeOff, Bot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const aiModels = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", desc: "Fast & balanced" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Good multimodal" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Best quality" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", desc: "Strong & affordable" },
  { id: "openai/gpt-5", name: "GPT-5", desc: "Most powerful" },
];

const colorSchemes = [
  { name: "Earth Tones", colors: ["#8B6F47", "#2D5016", "#D4A574"] },
  { name: "Ocean Blue", colors: ["#1E40AF", "#06B6D4", "#F0F9FF"] },
  { name: "Sunset Warm", colors: ["#DC2626", "#F97316", "#FEF3C7"] },
  { name: "Forest Green", colors: ["#166534", "#4ADE80", "#F0FDF4"] },
  { name: "Royal Purple", colors: ["#7C3AED", "#A855F7", "#FAF5FF"] },
  { name: "Charcoal Modern", colors: ["#1F2937", "#6B7280", "#F9FAFB"] },
];

interface WebsiteData {
  id: string;
  name: string;
  subdomain: string;
  industry: string;
  description: string | null;
  services: string | null;
  target_audience: string | null;
  color_scheme: string | null;
  contact_email: string | null;
  phone: string | null;
  location: string | null;
  generated_html: string | null;
  generated_css: string | null;
  generated_js: string | null;
  status: string;
}

const Editor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const websiteId = searchParams.get("id");
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");

  useEffect(() => {
    if (!websiteId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchWebsite();
  }, [websiteId]);

  const fetchWebsite = async () => {
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("id", websiteId!)
      .single();

    if (error || !data) {
      toast.error("Website not found");
      navigate("/dashboard", { replace: true });
      return;
    }

    setWebsite(data as WebsiteData);
    setName(data.name);
    setDescription(data.description || "");
    setServices(data.services || "");
    setTargetAudience(data.target_audience || "");
    setColorScheme(data.color_scheme || "");
    setContactEmail(data.contact_email || "");
    setPhone(data.phone || "");
    setLocation(data.location || "");
    setLoading(false);
  };

  const handleSave = async () => {
    if (!websiteId) return;
    setSaving(true);

    const { error } = await supabase
      .from("websites")
      .update({
        name,
        description,
        services,
        target_audience: targetAudience,
        color_scheme: colorScheme,
        contact_email: contactEmail,
        phone,
        location,
      })
      .eq("id", websiteId);

    if (error) {
      toast.error("Failed to save changes");
    } else {
      toast.success("Changes saved!");
    }
    setSaving(false);
  };

  const handleRegenerate = async () => {
    if (!websiteId) return;
    setRegenerating(true);

    // Save first
    await handleSave();

    const { error } = await supabase.functions.invoke("generate-website", {
      body: { websiteId, model: selectedModel },
    });

    if (error) {
      toast.error("Regeneration failed");
      setRegenerating(false);
      return;
    }

    toast.info("Regenerating website with your changes...");

    // Poll for completion
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("websites")
        .select("status, generated_html, generated_css, generated_js")
        .eq("id", websiteId)
        .single();

      if (data?.status === "live") {
        clearInterval(poll);
        setRegenerating(false);
        setWebsite((prev) =>
          prev
            ? {
                ...prev,
                generated_html: data.generated_html,
                generated_css: data.generated_css,
                generated_js: data.generated_js,
                status: "live",
              }
            : prev
        );
        toast.success("Website regenerated!");
      } else if (data?.status === "failed") {
        clearInterval(poll);
        setRegenerating(false);
        toast.error("Regeneration failed. Try again.");
      }
    }, 3000);
  };

  const iframeSrc = website
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${website.generated_css || ""}</style></head><body>${website.generated_html || ""}<script>${website.generated_js || ""}<\/script></body></html>`
    : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top bar */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <span className="font-semibold">{name || "Edit Website"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden md:flex"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {regenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Form panel */}
        <div className={`${showPreview ? "w-[400px]" : "w-full max-w-2xl mx-auto"} border-r bg-card overflow-y-auto p-6 space-y-6`}>
          <div>
            <h2 className="text-lg font-semibold mb-1">Business Information</h2>
            <p className="text-sm text-muted-foreground">Update details and regenerate your website.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Business Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your business..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Products / Services</label>
              <Textarea
                value={services}
                onChange={(e) => setServices(e.target.value)}
                rows={3}
                placeholder="List your main products or services..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Audience</label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Young professionals in Kampala"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Color Scheme</label>
              <div className="grid grid-cols-2 gap-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.name}
                    onClick={() => setColorScheme(scheme.name)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      colorScheme === scheme.name
                        ? "border-primary shadow-card-hover"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      {scheme.colors.map((c) => (
                        <div
                          key={c}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Contact Email</label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="flex-1 relative">
            {regenerating && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Regenerating your website...</p>
                </div>
              </div>
            )}
            <iframe
              srcDoc={iframeSrc}
              className="w-full h-full border-0"
              title={`Preview of ${name}`}
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
