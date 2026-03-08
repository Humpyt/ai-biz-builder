import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Sparkles, RefreshCw, Eye, EyeOff, Bot, Globe, Code, Pencil, History, FileText, MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  custom_domain: string | null;
  status: string;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  generated_html: string | null;
  generated_css: string | null;
  generated_js: string | null;
  sort_order: number;
}

interface VersionData {
  id: string;
  version_number: number;
  model_used: string | null;
  created_at: string;
  generated_html: string | null;
  generated_css: string | null;
  generated_js: string | null;
  pages: any;
}

const Editor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const websiteId = searchParams.get("id");
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingPage, setRegeneratingPage] = useState<string | null>(null);
  const [pagePrompt, setPagePrompt] = useState("");
  const [promptPopoverOpen, setPromptPopoverOpen] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editorTab, setEditorTab] = useState("form");

  // Multi-page state
  const [pages, setPages] = useState<PageData[]>([]);
  const [activePage, setActivePage] = useState("index");

  // Version history state
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(false);

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
  const [customDomain, setCustomDomain] = useState("");

  // Code editor fields
  const [codeHtml, setCodeHtml] = useState("");
  const [codeCss, setCodeCss] = useState("");
  const [codeJs, setCodeJs] = useState("");

  useEffect(() => {
    if (!websiteId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchWebsite();
    fetchPages();
    fetchVersions();
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

    const w = data as WebsiteData;
    setWebsite(w);
    setName(w.name);
    setDescription(w.description || "");
    setServices(w.services || "");
    setTargetAudience(w.target_audience || "");
    setColorScheme(w.color_scheme || "");
    setContactEmail(w.contact_email || "");
    setPhone(w.phone || "");
    setLocation(w.location || "");
    setCustomDomain(w.custom_domain || "");
    setCodeHtml(w.generated_html || "");
    setCodeCss(w.generated_css || "");
    setCodeJs(w.generated_js || "");
    setLoading(false);
  };

  const fetchPages = async () => {
    const { data } = await supabase
      .from("website_pages")
      .select("*")
      .eq("website_id", websiteId!)
      .order("sort_order");

    if (data && data.length > 0) {
      setPages(data as PageData[]);
    }
  };

  const fetchVersions = async () => {
    const { data } = await supabase
      .from("website_versions")
      .select("*")
      .eq("website_id", websiteId!)
      .order("version_number", { ascending: false });

    if (data) {
      setVersions(data as VersionData[]);
    }
  };

  // When active page changes, update code editor
  useEffect(() => {
    if (pages.length === 0) return;
    const page = pages.find((p) => p.slug === activePage);
    if (page) {
      setCodeHtml(page.generated_html || "");
      setCodeCss(page.generated_css || "");
      setCodeJs(page.generated_js || "");
    } else if (activePage === "index" && website) {
      setCodeHtml(website.generated_html || "");
      setCodeCss(website.generated_css || "");
      setCodeJs(website.generated_js || "");
    }
  }, [activePage, pages]);

  const handleSave = async () => {
    if (!websiteId) return;
    setSaving(true);

    const updateData: Record<string, unknown> = {
      name, description, services,
      target_audience: targetAudience,
      color_scheme: colorScheme,
      contact_email: contactEmail,
      phone, location,
      custom_domain: customDomain || null,
    };

    if (editorTab === "code") {
      // Save to the active page if multi-page, otherwise to website
      const page = pages.find((p) => p.slug === activePage);
      if (page) {
        await supabase
          .from("website_pages")
          .update({
            generated_html: codeHtml,
            generated_css: codeCss,
            generated_js: codeJs,
          })
          .eq("id", page.id);

        // Also update main website if this is the index page
        if (activePage === "index") {
          updateData.generated_html = codeHtml;
          updateData.generated_css = codeCss;
          updateData.generated_js = codeJs;
        }
      } else {
        updateData.generated_html = codeHtml;
        updateData.generated_css = codeCss;
        updateData.generated_js = codeJs;
      }
    }

    const { error } = await supabase
      .from("websites")
      .update(updateData as any)
      .eq("id", websiteId);

    if (error) {
      toast.error("Failed to save changes");
    } else {
      toast.success("Changes saved!");
      if (editorTab === "code" && activePage === "index") {
        setWebsite((prev) =>
          prev ? { ...prev, generated_html: codeHtml, generated_css: codeCss, generated_js: codeJs } : prev
        );
      }
    }
    setSaving(false);
  };

  const handleRegenerate = async () => {
    if (!websiteId) return;
    setRegenerating(true);
    await handleSave();

    const { error } = await supabase.functions.invoke("generate-website", {
      body: { websiteId, model: selectedModel },
    });

    if (error) {
      toast.error("Regeneration failed");
      setRegenerating(false);
      return;
    }

    toast.info("Regenerating website with AI...");
    pollForCompletion();
  };

  const handleRegeneratePage = async (pageSlug: string, customPrompt?: string) => {
    if (!websiteId) return;
    setRegeneratingPage(pageSlug);
    setPromptPopoverOpen(null);
    setPagePrompt("");

    const body: Record<string, string> = { websiteId, model: selectedModel, pageSlug };
    if (customPrompt?.trim()) body.customPrompt = customPrompt.trim();

    const { error } = await supabase.functions.invoke("generate-website", { body });

    if (error) {
      toast.error(`Failed to regenerate ${pageSlug} page`);
      setRegeneratingPage(null);
      return;
    }

    toast.info(`Regenerating ${pageSlug} page...`);
    pollForCompletion(pageSlug);
  };

  const pollForCompletion = (pageSlug?: string) => {
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("websites")
        .select("status, generated_html, generated_css, generated_js")
        .eq("id", websiteId!)
        .single();

      if (data?.status === "live") {
        clearInterval(poll);
        setRegenerating(false);
        setRegeneratingPage(null);
        setWebsite((prev) =>
          prev
            ? { ...prev, generated_html: data.generated_html, generated_css: data.generated_css, generated_js: data.generated_js, status: "live" }
            : prev
        );
        fetchPages();
        fetchVersions();
        toast.success(pageSlug ? `${pageSlug} page regenerated!` : "Website regenerated!");
      } else if (data?.status === "failed") {
        clearInterval(poll);
        setRegenerating(false);
        setRegeneratingPage(null);
        toast.error("Regeneration failed. Try again.");
      }
    }, 3000);
  };

  const handleRestoreVersion = async (version: VersionData) => {
    if (!websiteId) return;
    setRestoringVersion(true);

    try {
      // Restore main website fields
      await supabase
        .from("websites")
        .update({
          generated_html: version.generated_html,
          generated_css: version.generated_css,
          generated_js: version.generated_js,
        })
        .eq("id", websiteId);

      // Restore pages if version has them
      if (version.pages && Array.isArray(version.pages)) {
        await supabase.from("website_pages").delete().eq("website_id", websiteId);

        const pageInserts = version.pages.map((p: any, i: number) => ({
          website_id: websiteId,
          slug: p.slug,
          title: p.title,
          generated_html: p.html,
          generated_css: p.css,
          generated_js: p.js,
          sort_order: i,
        }));

        if (pageInserts.length > 0) {
          await supabase.from("website_pages").insert(pageInserts);
        }
      }

      // Refresh state
      setWebsite((prev) =>
        prev
          ? { ...prev, generated_html: version.generated_html, generated_css: version.generated_css, generated_js: version.generated_js }
          : prev
      );
      setCodeHtml(version.generated_html || "");
      setCodeCss(version.generated_css || "");
      setCodeJs(version.generated_js || "");
      fetchPages();

      toast.success(`Restored to version ${version.version_number}`);
      setShowVersions(false);
    } catch (e) {
      toast.error("Failed to restore version");
    }

    setRestoringVersion(false);
  };

  const previewSrc = (() => {
    const h = editorTab === "code" ? codeHtml : (() => {
      const page = pages.find((p) => p.slug === activePage);
      return page?.generated_html || website?.generated_html || "";
    })();
    const c = editorTab === "code" ? codeCss : (() => {
      const page = pages.find((p) => p.slug === activePage);
      return page?.generated_css || website?.generated_css || "";
    })();
    const j = editorTab === "code" ? codeJs : (() => {
      const page = pages.find((p) => p.slug === activePage);
      return page?.generated_js || website?.generated_js || "";
    })();

    if (h.trim().toLowerCase().startsWith("<!doctype") || h.trim().toLowerCase().startsWith("<html")) {
      return h
        .replace("</head>", `<style>${c}</style></head>`)
        .replace("</body>", `<script>${j}<\/script></body>`);
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${c}</style></head><body>${h}<script>${j}<\/script></body></html>`;
  })();

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
            onClick={() => setShowVersions(!showVersions)}
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Versions</span>
          </Button>
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

      {/* Page tabs (multi-page navigation) */}
      {pages.length > 1 && (
        <div className="bg-card border-b px-4 py-2 flex items-center gap-1 overflow-x-auto">
          <FileText className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
          {pages.map((page) => (
            <div key={page.slug} className="flex items-center gap-0.5">
              <button
                onClick={() => setActivePage(page.slug)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${
                  activePage === page.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {page.title}
              </button>
              {activePage === page.slug && (
                <Popover
                  open={promptPopoverOpen === page.slug}
                  onOpenChange={(open) => {
                    setPromptPopoverOpen(open ? page.slug : null);
                    if (!open) setPagePrompt("");
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      disabled={regeneratingPage === page.slug || regenerating}
                      title={`Regenerate ${page.title}`}
                    >
                      {regeneratingPage === page.slug ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Regenerate {page.title}</p>
                      <Textarea
                        placeholder="Optional: Add instructions like 'make it more modern' or 'add testimonials'..."
                        value={pagePrompt}
                        onChange={(e) => setPagePrompt(e.target.value)}
                        className="text-sm min-h-[60px] resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRegeneratePage(page.slug, pagePrompt)}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPromptPopoverOpen(null);
                            setPagePrompt("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Form/Code panel */}
        <div className={`${showPreview ? "w-[420px]" : "w-full max-w-2xl mx-auto"} border-r bg-card overflow-y-auto flex flex-col`}>
          <Tabs value={editorTab} onValueChange={setEditorTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4 mb-2">
              <TabsTrigger value="form" className="flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Form
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
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
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe your business..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Products / Services</label>
                  <Textarea value={services} onChange={(e) => setServices(e.target.value)} rows={3} placeholder="List your main products or services..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Target Audience</label>
                  <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Young professionals in Kampala" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Color Scheme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorSchemes.map((scheme) => (
                      <button
                        key={scheme.name}
                        onClick={() => setColorScheme(scheme.name)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          colorScheme === scheme.name ? "border-primary shadow-card-hover" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex gap-1 mb-1">
                          {scheme.colors.map((c) => (
                            <div key={c} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-xs font-medium">{scheme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> AI Model
                  </label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {aiModels.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="font-medium">{m.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">— {m.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Contact Email</label>
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Custom Domain
                  </label>
                  <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="e.g. www.mybusiness.com" />
                  <p className="text-xs text-muted-foreground mt-1.5">Save your desired domain. Public hosting coming soon.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  Code Editor {pages.length > 1 && <span className="text-muted-foreground font-normal text-sm">— {pages.find(p => p.slug === activePage)?.title || "Home"}</span>}
                </h2>
                <p className="text-sm text-muted-foreground">Edit HTML, CSS, and JS directly. Changes preview live.</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">HTML</label>
                <textarea
                  value={codeHtml}
                  onChange={(e) => setCodeHtml(e.target.value)}
                  className="w-full h-48 font-mono text-xs bg-muted/50 border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">CSS</label>
                <textarea
                  value={codeCss}
                  onChange={(e) => setCodeCss(e.target.value)}
                  className="w-full h-36 font-mono text-xs bg-muted/50 border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">JavaScript</label>
                <textarea
                  value={codeJs}
                  onChange={(e) => setCodeJs(e.target.value)}
                  className="w-full h-36 font-mono text-xs bg-muted/50 border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  spellCheck={false}
                />
              </div>
            </TabsContent>
          </Tabs>
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
              srcDoc={previewSrc}
              className="w-full h-full border-0"
              title={`Preview of ${name}`}
              sandbox="allow-scripts"
            />
          </div>
        )}

        {/* Version history panel */}
        {showVersions && (
          <div className="w-[300px] border-l bg-card overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4" /> Version History
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowVersions(false)}>✕</Button>
            </div>

            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions yet. Generate your website to create the first version.</p>
            ) : (
              <div className="space-y-3">
                {versions.map((v) => (
                  <div key={v.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Version {v.version_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(v.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                    {v.model_used && (
                      <p className="text-xs text-muted-foreground">
                        Model: {v.model_used.split("/").pop()}
                      </p>
                    )}
                    {v.pages && Array.isArray(v.pages) && (
                      <p className="text-xs text-muted-foreground">
                        {v.pages.length} page{v.pages.length > 1 ? "s" : ""}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={restoringVersion}
                      onClick={() => handleRestoreVersion(v)}
                    >
                      <RefreshCw className="w-3 h-3" /> Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
