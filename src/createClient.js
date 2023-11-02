import { createClient } from "@supabase/supabase-js";

export const supabase= createClient(
    "https://xnedjgcuhgiedvupstdh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZWRqZ2N1aGdpZWR2dXBzdGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg3ODYxMDUsImV4cCI6MjAxNDM2MjEwNX0.gHJAfRn43GRyCeeQV6xOw2N2Bh1_D34Y_rvyG1t4UXQ"
    )

// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = 'https://xnedjgcuhgiedvupstdh.supabase.co'
// const supabaseKey = process.env.SUPABASE_KEY
// export const supabase = createClient(supabaseUrl, supabaseKey)

// export default supabase;