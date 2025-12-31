import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAssistantActivityLogger } from "@/hooks/useAssistantActivityLogger";

export function AssistantActivityTracker() {
    const { user } = useAuth();
    const location = useLocation();
    const [adminId, setAdminId] = useState<string | null>(null);
    const [assistantEmail, setAssistantEmail] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const { addLog } = useAssistantActivityLogger();

    // Initial check: Am I an assistant?
    useEffect(() => {
        if (!user) {
            setIsChecking(false);
            return;
        }

        const checkAssistant = async () => {
            try {
                const { data, error } = await supabase
                    .from("assistants")
                    .select("user_id, assistant_email")
                    .eq("assistant_id", user.id)
                    .maybeSingle();

                if (data) {
                    setAdminId(data.user_id);
                    setAssistantEmail(data.assistant_email);
                }
            } catch (error) {
                console.error("Error checking assistant status:", error);
            } finally {
                setIsChecking(false);
            }
        };
        checkAssistant();
    }, [user]);

    // Track location changes
    useEffect(() => {
        if (!user || !adminId || !assistantEmail || isChecking) return;

        const logView = () => {
            try {
                addLog({
                    assistant_id: user.id,
                    assistant_email: assistantEmail,
                    admin_id: adminId,
                    action_type: "PAGE_VIEW",
                    details: { path: location.pathname }
                });
            } catch (err) {
                console.error("Failed to log page view", err);
            }
        };

        logView();
    }, [location.pathname, user, adminId, assistantEmail, isChecking, addLog]);

    return null;
}
